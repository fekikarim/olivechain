const BatchRegistry = artifacts.require("BatchRegistry");
const { expectError, olv, ZERO } = require("../helpers");

contract("BatchRegistry", ([regulator, inspector, farmer, mill, escrow, stranger]) => {
  let r;
  const URI = "ipfs://olivechain/chemlali-lot-01";
  const HASH = web3.utils.keccak256("checkpoint");

  beforeEach(async () => {
    r = await BatchRegistry.new({ from: regulator });
    await r.setInspector(inspector, true, { from: regulator });
    await r.setEscrow(escrow, { from: regulator });
    await r.mintBatch(farmer, URI, olv(200), { from: farmer });
  });

  describe("mintBatch", () => {
    it("mints an NFT to the farmer with price and URI", async () => {
      assert.equal(await r.ownerOf(1), farmer);
      assert.equal(await r.custodianOf(1), farmer);
      assert.equal((await r.getLastPrice(1)).toString(), olv(200));
      assert.equal(await r.tokenURI(1), URI);
      assert.equal(await r.isCertified(1), false);
      assert.equal((await r.totalBatches()).toNumber(), 1);
    });
    it("emits BatchMinted and PriceRecorded", async () => {
      const tx = await r.mintBatch(farmer, URI, olv(10), { from: farmer });
      assert.equal(tx.logs.find((l) => l.event === "BatchMinted").args.batchId.toNumber(), 2);
      assert.equal(tx.logs.find((l) => l.event === "PriceRecorded").args.price.toString(), olv(10));
    });
    it("rejects zero price, oversized price and zero receiver", async () => {
      await expectError(r.mintBatch(farmer, URI, 0), BatchRegistry, "ZeroPrice");
      await expectError(r.mintBatch(farmer, URI, web3.utils.toBN(2).pow(web3.utils.toBN(128))), BatchRegistry, "PriceTooHigh");
      await expectError(r.mintBatch(ZERO, URI, olv(1)), BatchRegistry, "ERC721InvalidReceiver");
    });
  });

  describe("transferCustody", () => {
    it("moves custody and emits CustodyTransferred", async () => {
      const tx = await r.transferCustody(1, mill, { from: farmer });
      const ev = tx.logs.find((l) => l.event === "CustodyTransferred").args;
      assert.deepEqual([ev.from, ev.to], [farmer, mill]);
      assert.equal(await r.custodianOf(1), mill);
    });
    it("only the current custodian can transfer", async () => {
      await expectError(r.transferCustody(1, mill, { from: stranger }), BatchRegistry, "ERC721IncorrectOwner");
    });
    it("rejects unknown batch and zero address", async () => {
      await expectError(r.transferCustody(99, mill, { from: farmer }), BatchRegistry, "ERC721NonexistentToken");
      await expectError(r.transferCustody(1, ZERO, { from: farmer }), BatchRegistry, "ERC721InvalidReceiver");
    });
    it("standard ERC-721 transfers also emit CustodyTransferred", async () => {
      const tx = await r.transferFrom(farmer, mill, 1, { from: farmer });
      assert.ok(tx.logs.some((l) => l.event === "CustodyTransferred"));
      assert.equal(await r.custodianOf(1), mill);
    });
  });

  describe("inspector actions", () => {
    it("addCheckpoint emits CheckpointAdded", async () => {
      const tx = await r.addCheckpoint(1, HASH, { from: inspector });
      const ev = tx.logs[0];
      assert.equal(ev.event, "CheckpointAdded");
      assert.deepEqual([ev.args.dataHash, ev.args.inspector], [HASH, inspector]);
    });
    it("certifyBatch sets flag, emits event, only once", async () => {
      const tx = await r.certifyBatch(1, { from: inspector });
      assert.equal(tx.logs[0].event, "BatchCertified");
      assert.equal(await r.isCertified(1), true);
      await expectError(r.certifyBatch(1, { from: inspector }), BatchRegistry, "AlreadyCertified");
    });
    it("non-inspectors are rejected", async () => {
      await expectError(r.addCheckpoint(1, HASH, { from: stranger }), BatchRegistry, "NotInspector");
      await expectError(r.certifyBatch(1, { from: farmer }), BatchRegistry, "NotInspector");
    });
    it("unknown batch is rejected", async () => {
      await expectError(r.addCheckpoint(7, HASH, { from: inspector }), BatchRegistry, "ERC721NonexistentToken");
      await expectError(r.certifyBatch(7, { from: inspector }), BatchRegistry, "ERC721NonexistentToken");
    });
    it("certification survives custody transfers", async () => {
      await r.certifyBatch(1, { from: inspector });
      await r.transferCustody(1, mill, { from: farmer });
      assert.equal(await r.isCertified(1), true);
    });
  });

  describe("regulator", () => {
    it("grants and revokes inspectors with events", async () => {
      const tx = await r.setInspector(stranger, true, { from: regulator });
      assert.equal(tx.logs[0].event, "InspectorSet");
      assert.equal(await r.isInspector(stranger), true);
      await r.setInspector(stranger, false, { from: regulator });
      assert.equal(await r.isInspector(stranger), false);
    });
    it("only the owner manages roles and escrow", async () => {
      await expectError(r.setInspector(stranger, true, { from: farmer }), BatchRegistry, "OwnableUnauthorizedAccount");
      await expectError(r.setEscrow(stranger, { from: farmer }), BatchRegistry, "OwnableUnauthorizedAccount");
    });
    it("rejects zero addresses", async () => {
      await expectError(r.setInspector(ZERO, true), BatchRegistry, "ZeroAddress");
      await expectError(r.setEscrow(ZERO), BatchRegistry, "ZeroAddress");
    });
    it("setEscrow emits EscrowSet", async () => {
      const tx = await r.setEscrow(stranger, { from: regulator });
      assert.equal(tx.logs[0].event, "EscrowSet");
      assert.equal(await r.escrow(), stranger);
    });
  });

  describe("recordSalePrice", () => {
    it("escrow updates price and emits PriceRecorded", async () => {
      const tx = await r.recordSalePrice(1, olv(230), { from: escrow });
      assert.equal(tx.logs[0].event, "PriceRecorded");
      assert.equal((await r.getLastPrice(1)).toString(), olv(230));
    });
    it("only the escrow may call it", async () => {
      await expectError(r.recordSalePrice(1, olv(1), { from: regulator }), BatchRegistry, "NotEscrow");
    });
    it("validates price and batch", async () => {
      await expectError(r.recordSalePrice(1, 0, { from: escrow }), BatchRegistry, "ZeroPrice");
      await expectError(r.recordSalePrice(9, olv(1), { from: escrow }), BatchRegistry, "ERC721NonexistentToken");
    });
  });
});
