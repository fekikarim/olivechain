// Plays the whole supply chain on the deployed contracts (Ganache). Run: npm run demo
const BatchRegistry = artifacts.require("BatchRegistry");
const OliveCoin = artifacts.require("OliveCoin");
const PriceCapEscrow = artifacts.require("PriceCapEscrow");

module.exports = async function (done) {
  try {
    const [, inspector, farmer, mill, distributor, grocery] = await web3.eth.getAccounts();
    const olv = (n) => web3.utils.toWei(String(n));
    const reg = await BatchRegistry.deployed();
    const coin = await OliveCoin.deployed();
    const esc = await PriceCapEscrow.deployed();

    const minted = await reg.mintBatch(farmer, "ipfs://olivechain/chemlali-500kg", olv(200), { from: farmer });
    const id = minted.logs.find((l) => l.event === "BatchMinted").args.batchId;
    await reg.transferCustody(id, mill, { from: farmer });
    const hash = web3.utils.keccak256(`demo-${id}`);
    await reg.addCheckpoint(id, hash, { from: inspector });
    await reg.transferCustody(id, distributor, { from: mill });
    await reg.certifyBatch(id, { from: inspector });
    console.log(`batch #${id} minted, moved to distributor, certified`);

    try {
      await esc.createSale(id, olv(300), { from: distributor });
      throw new Error("overpriced sale was accepted");
    } catch (e) {
      if (e.message === "overpriced sale was accepted") throw e;
      console.log("sale at 300 OLV rejected (cap 240)");
    }
    const sale = await esc.createSale(id, olv(230), { from: distributor });
    const saleId = sale.logs[0].args.saleId;
    await coin.approve(esc.address, olv(230), { from: grocery });
    await esc.deposit(saleId, { from: grocery });
    await reg.transferCustody(id, grocery, { from: distributor });
    await esc.releasePayment(saleId, { from: grocery });
    console.log(`sale #${saleId} released; last price = ${web3.utils.fromWei(await reg.getLastPrice(id))} OLV`);
    done();
  } catch (e) {
    done(e);
  }
};
