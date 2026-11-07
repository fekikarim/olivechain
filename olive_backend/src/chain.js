import { readFileSync, existsSync } from "node:fs";
import { Contract, JsonRpcProvider } from "ethers";

/** Loads provider + contracts from the generated deployments.json (never hardcode ABIs). */
export function createChain({ rpcUrl, deploymentsFile }) {
  const provider = new JsonRpcProvider(rpcUrl);
  const deployments = existsSync(deploymentsFile) ? JSON.parse(readFileSync(deploymentsFile, "utf8")) : {};
  const contract = (name) => {
    const d = deployments[name];
    return d ? new Contract(d.address, d.abi, provider) : null;
  };
  return {
    provider,
    registry: contract("BatchRegistry"),
    coin: contract("OliveCoin"),
    escrow: contract("PriceCapEscrow"),
    addresses: Object.fromEntries(Object.entries(deployments).map(([k, v]) => [k, v.address])),
  };
}
