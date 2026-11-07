// Scenarios from todo/olive_idea1.md §8 with the real registry + coin + escrow.
const BatchRegistry = artifacts.require("BatchRegistry");
const OliveCoin = artifacts.require("OliveCoin");
const PriceCapEscrow = artifacts.require("PriceCapEscrow");
const { expectError, olv } = require("../helpers");

contract("Supply chain (integration)", ([regulator, inspector, farmer, mill, distributor, grocery, stranger]) => {
  let reg, coin, esc, id;
  const HASH = web3.utils.keccak256("acidity 0.3; polyphenols 320");

  beforeEach(async () => {
    reg = await BatchRegistry.new({ from: regulator });
    coin = await OliveCoin.new({ from: regulator });
    esc = await PriceCapEscrow.new(reg.address, coin.address, 20, { from: regulator });
    await reg.setEscrow(esc.address, { from: regulator });
    await reg.setInspector(inspector, true, { from: regulator });
    await coin.mint(grocery, olv(1000), { from: regulator });
    await coin.approve(esc.address, olv(1000), { from: grocery });

    // farmer -> mill -> distributor
    await reg.mintBatch(farmer, "ipfs://chemlali-500kg", olv(200), { from: farmer });
    id = 1;
    await reg.transferCustody(id, mill, { from: farmer });
    await reg.addCheckpoint(id, HASH, { from: inspector });
    await reg.transferCustody(id, distributor, { from: mill });
  });

  it("happy path: certify, sale within cap, payment released, price recorded", async () => {
    await reg.certifyBatch(id, { from: inspector });
    const created = await esc.createSale(id, olv(230), { from: distributor });
    const saleId = created.logs[0].args.saleId;
    await esc.deposit(saleId, { from: grocery });
    await reg.transferCustody(id, grocery, { from: distributor });
    await esc.releasePayment(saleId, { from: stranger });

    assert.equal((await coin.balanceOf(distributor)).toString(), olv(230));
    assert.equal((await reg.getLastPrice(id)).toString(), olv(230));
    assert.equal(await reg.custodianOf(id), grocery);
  });

  it("overpriced sale is rejected (300 > cap 240)", async () => {
    await reg.certifyBatch(id, { from: inspector });
    await expectError(esc.createSale(id, olv(300), { from: distributor }), PriceCapEscrow, "PriceAboveCap");
  });

  it("price cap tracks the new last price after a sale", async () => {
    await reg.certifyBatch(id, { from: inspector });
    const saleId = (await esc.createSale(id, olv(240), { from: distributor })).logs[0].args.saleId;
    await esc.deposit(saleId, { from: grocery });
    await reg.transferCustody(id, grocery, { from: distributor });
    await esc.releasePayment(saleId);
    assert.equal((await esc.priceCap(id)).toString(), olv(288)); // 240 * 1.2
  });

  it("release blocked: batch not certified", async () => {
    const saleId = (await esc.createSale(id, olv(230), { from: distributor })).logs[0].args.saleId;
    await esc.deposit(saleId, { from: grocery });
    await reg.transferCustody(id, grocery, { from: distributor });
    await expectError(esc.releasePayment(saleId), PriceCapEscrow, "NotCertified");
  });

  it("release blocked: custody not moved", async () => {
    await reg.certifyBatch(id, { from: inspector });
    const saleId = (await esc.createSale(id, olv(230), { from: distributor })).logs[0].args.saleId;
    await esc.deposit(saleId, { from: grocery });
    await expectError(esc.releasePayment(saleId), PriceCapEscrow, "CustodyNotMoved");
  });

  it("refund after the delivery never happens", async () => {
    const saleId = (await esc.createSale(id, olv(230), { from: distributor })).logs[0].args.saleId;
    await esc.deposit(saleId, { from: grocery });
    await esc.refund(saleId, { from: grocery });
    assert.equal((await coin.balanceOf(grocery)).toString(), olv(1000));
  });

  it("cancelled sale cannot be funded", async () => {
    const saleId = (await esc.createSale(id, olv(230), { from: distributor })).logs[0].args.saleId;
    await esc.cancelSale(saleId, { from: distributor });
    await expectError(esc.deposit(saleId, { from: grocery }), PriceCapEscrow, "WrongState");
  });

  it("a second open sale cannot be released after custody moved to another buyer", async () => {
    await reg.certifyBatch(id, { from: inspector });
    await coin.mint(stranger, olv(500), { from: regulator });
    await coin.approve(esc.address, olv(500), { from: stranger });
    const s1 = (await esc.createSale(id, olv(230), { from: distributor })).logs[0].args.saleId;
    const s2 = (await esc.createSale(id, olv(230), { from: distributor })).logs[0].args.saleId;
    await esc.deposit(s1, { from: grocery });
    await esc.deposit(s2, { from: stranger });
    await reg.transferCustody(id, grocery, { from: distributor });
    await esc.releasePayment(s1);
    await expectError(esc.releasePayment(s2), PriceCapEscrow, "CustodyNotMoved");
    await esc.refund(s2, { from: stranger });
  });

  it("unauthorized addresses cannot certify, checkpoint or record prices", async () => {
    await expectError(reg.certifyBatch(id, { from: stranger }), BatchRegistry, "NotInspector");
    await expectError(reg.addCheckpoint(id, HASH, { from: stranger }), BatchRegistry, "NotInspector");
    await expectError(reg.recordSalePrice(id, olv(1), { from: stranger }), BatchRegistry, "NotEscrow");
  });

  it("price history is traceable from events", async () => {
    await reg.certifyBatch(id, { from: inspector });
    const saleId = (await esc.createSale(id, olv(230), { from: distributor })).logs[0].args.saleId;
    await esc.deposit(saleId, { from: grocery });
    await reg.transferCustody(id, grocery, { from: distributor });
    await esc.releasePayment(saleId);
    const prices = (await reg.getPastEvents("PriceRecorded", { fromBlock: 0, filter: { batchId: id } })).map((e) => e.returnValues.price);
    assert.deepEqual(prices, [olv(200), olv(230)]);
    const moves = await reg.getPastEvents("CustodyTransferred", { fromBlock: 0, filter: { batchId: id } });
    assert.equal(moves.length, 3);
  });
});
