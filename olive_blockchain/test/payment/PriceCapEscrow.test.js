const OliveCoin = artifacts.require("OliveCoin");
const PriceCapEscrow = artifacts.require("PriceCapEscrow");
const MockBatchRegistry = artifacts.require("MockBatchRegistry");
const { expectError, olv, ZERO } = require("../helpers");

const State = { None: 0, Created: 1, Deposited: 2, Released: 3, Refunded: 4, Cancelled: 5 };

contract("OliveCoin", ([authority, alice, stranger]) => {
  it("is ERC-20 OLV, mintable only by the authority", async () => {
    const c = await OliveCoin.new({ from: authority });
    assert.equal(await c.symbol(), "OLV");
    assert.equal((await c.decimals()).toNumber(), 18);
    await c.mint(alice, olv(5), { from: authority });
    assert.equal((await c.balanceOf(alice)).toString(), olv(5));
    await expectError(c.mint(alice, 1, { from: stranger }), OliveCoin, "OwnableUnauthorizedAccount");
  });
});

contract("PriceCapEscrow", ([authority, seller, buyer, stranger]) => {
  let reg, coin, esc;
  const ID = 1;

  beforeEach(async () => {
    reg = await MockBatchRegistry.new();
    coin = await OliveCoin.new({ from: authority });
    esc = await PriceCapEscrow.new(reg.address, coin.address, 20, { from: authority });
    await reg.setBatch(ID, seller, olv(200), true);
    await coin.mint(buyer, olv(1000), { from: authority });
    await coin.approve(esc.address, olv(1000), { from: buyer });
  });

  const sale = async (price = olv(230)) => (await esc.createSale(ID, price, { from: seller })).logs[0].args.saleId.toNumber();

  describe("constructor and markup", () => {
    it("stores config", async () => {
      assert.equal(await esc.registry(), reg.address);
      assert.equal(await esc.token(), coin.address);
      assert.equal((await esc.maxMarkupPercent()).toNumber(), 20);
      assert.equal((await esc.priceCap(ID)).toString(), olv(240));
    });
    it("rejects zero addresses and invalid markup", async () => {
      await expectError(PriceCapEscrow.new(ZERO, coin.address, 20), PriceCapEscrow, "ZeroAddress");
      await expectError(PriceCapEscrow.new(reg.address, ZERO, 20), PriceCapEscrow, "ZeroAddress");
      await expectError(PriceCapEscrow.new(reg.address, coin.address, 1001), PriceCapEscrow, "InvalidMarkup");
    });
    it("authority sets markup; others cannot", async () => {
      const tx = await esc.setMaxMarkup(50, { from: authority });
      assert.equal(tx.logs[0].event, "MarkupChanged");
      assert.equal((await esc.priceCap(ID)).toString(), olv(300));
      await expectError(esc.setMaxMarkup(10, { from: seller }), PriceCapEscrow, "OwnableUnauthorizedAccount");
      await expectError(esc.setMaxMarkup(1001, { from: authority }), PriceCapEscrow, "InvalidMarkup");
    });
  });

  describe("createSale", () => {
    it("accepts a price within the cap (cap itself included)", async () => {
      const tx = await esc.createSale(ID, olv(240), { from: seller });
      assert.equal(tx.logs[0].event, "SaleCreated");
      const s = await esc.getSale(1);
      assert.equal(s.seller, seller);
      assert.equal(s.state * 1, State.Created);
    });
    it("rejects price above the cap", async () => {
      await expectError(esc.createSale(ID, olv(300), { from: seller }), PriceCapEscrow, "PriceAboveCap");
    });
    it("rejects zero price and non-custodian", async () => {
      await expectError(esc.createSale(ID, 0, { from: seller }), PriceCapEscrow, "ZeroPrice");
      await expectError(esc.createSale(ID, olv(100), { from: stranger }), PriceCapEscrow, "NotCustodian");
    });
  });

  describe("cancelSale", () => {
    it("seller cancels before deposit", async () => {
      const id = await sale();
      const tx = await esc.cancelSale(id, { from: seller });
      assert.equal(tx.logs[0].event, "SaleCancelled");
      assert.equal((await esc.getSale(id)).state * 1, State.Cancelled);
      await expectError(esc.deposit(id, { from: buyer }), PriceCapEscrow, "WrongState");
    });
    it("only the seller, only when Created", async () => {
      const id = await sale();
      await expectError(esc.cancelSale(id, { from: buyer }), PriceCapEscrow, "NotSeller");
      await esc.deposit(id, { from: buyer });
      await expectError(esc.cancelSale(id, { from: seller }), PriceCapEscrow, "WrongState");
    });
  });

  describe("deposit", () => {
    it("locks OLV and emits Deposited", async () => {
      const id = await sale();
      const tx = await esc.deposit(id, { from: buyer });
      assert.equal(tx.logs[0].event, "Deposited");
      assert.equal((await coin.balanceOf(esc.address)).toString(), olv(230));
      assert.equal((await coin.balanceOf(buyer)).toString(), olv(770));
      const s = await esc.getSale(id);
      assert.deepEqual([s.buyer, s.state * 1], [buyer, State.Deposited]);
    });
    it("rejects seller as buyer, double deposit and missing allowance", async () => {
      const id = await sale();
      await expectError(esc.deposit(id, { from: seller }), PriceCapEscrow, "SelfSale");
      await esc.deposit(id, { from: buyer });
      await expectError(esc.deposit(id, { from: buyer }), PriceCapEscrow, "WrongState");
      const id2 = await sale();
      await expectError(esc.deposit(id2, { from: stranger }), OliveCoin, "ERC20InsufficientAllowance");
    });
    it("rejects unknown sale", async () => {
      await expectError(esc.deposit(42, { from: buyer }), PriceCapEscrow, "WrongState");
    });
  });

  describe("releasePayment", () => {
    it("pays the seller, records price, once", async () => {
      const id = await sale();
      await esc.deposit(id, { from: buyer });
      await reg.setCustodian(ID, buyer);
      const tx = await esc.releasePayment(id, { from: stranger });
      assert.equal(tx.logs[0].event, "PaymentReleased");
      assert.equal((await coin.balanceOf(seller)).toString(), olv(230));
      assert.equal((await coin.balanceOf(esc.address)).toString(), "0");
      assert.equal((await reg.lastPrice(ID)).toString(), olv(230));
      assert.equal((await esc.getSale(id)).state * 1, State.Released);
      await expectError(esc.releasePayment(id), PriceCapEscrow, "WrongState");
      await expectError(esc.refund(id, { from: buyer }), PriceCapEscrow, "WrongState");
    });
    it("blocked when not certified", async () => {
      const id = await sale();
      await esc.deposit(id, { from: buyer });
      await reg.setCustodian(ID, buyer);
      await reg.setCertified(ID, false);
      await expectError(esc.releasePayment(id), PriceCapEscrow, "NotCertified");
    });
    it("blocked when custody has not moved", async () => {
      const id = await sale();
      await esc.deposit(id, { from: buyer });
      await expectError(esc.releasePayment(id), PriceCapEscrow, "CustodyNotMoved");
    });
    it("blocked before deposit", async () => {
      const id = await sale();
      await expectError(esc.releasePayment(id), PriceCapEscrow, "WrongState");
    });
  });

  describe("refund", () => {
    it("buyer is refunded when custody did not move", async () => {
      const id = await sale();
      await esc.deposit(id, { from: buyer });
      const tx = await esc.refund(id, { from: buyer });
      assert.equal(tx.logs[0].event, "Refunded");
      assert.equal((await coin.balanceOf(buyer)).toString(), olv(1000));
      assert.equal((await esc.getSale(id)).state * 1, State.Refunded);
    });
    it("buyer is refunded when the batch is not certified, even if custody moved", async () => {
      const id = await sale();
      await esc.deposit(id, { from: buyer });
      await reg.setCustodian(ID, buyer);
      await reg.setCertified(ID, false);
      await esc.refund(id, { from: buyer });
      assert.equal((await coin.balanceOf(buyer)).toString(), olv(1000));
    });
    it("blocked once certified and delivered (must release)", async () => {
      const id = await sale();
      await esc.deposit(id, { from: buyer });
      await reg.setCustodian(ID, buyer);
      await expectError(esc.refund(id, { from: buyer }), PriceCapEscrow, "ConditionsMet");
    });
    it("only the buyer, only once", async () => {
      const id = await sale();
      await esc.deposit(id, { from: buyer });
      await expectError(esc.refund(id, { from: stranger }), PriceCapEscrow, "NotBuyer");
      await esc.refund(id, { from: buyer });
      await expectError(esc.refund(id, { from: buyer }), PriceCapEscrow, "WrongState");
    });
  });
});
