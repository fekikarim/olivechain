const BatchRegistry = artifacts.require("BatchRegistry");
const OliveCoin = artifacts.require("OliveCoin");
const PriceCapEscrow = artifacts.require("PriceCapEscrow");

const MARKUP_PERCENT = 20;
const DEMO_BALANCE = web3.utils.toWei("10000");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(BatchRegistry);
  await deployer.deploy(OliveCoin);
  await deployer.deploy(PriceCapEscrow, BatchRegistry.address, OliveCoin.address, MARKUP_PERCENT);

  const registry = await BatchRegistry.deployed();
  const coin = await OliveCoin.deployed();
  await registry.setEscrow(PriceCapEscrow.address);

  if (network === "development") {
    // Demo setup: accounts[1] is the quality inspector; accounts 1-9 get OLV to trade.
    await registry.setInspector(accounts[1], true);
    for (const a of accounts.slice(1, 10)) await coin.mint(a, DEMO_BALANCE);
  }
};
