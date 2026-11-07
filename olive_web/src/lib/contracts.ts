import { Contract, JsonRpcProvider, Network, type ContractRunner, type InterfaceAbi } from "ethers";
import deployments from "@/contracts/deployments.json";
import { CHAIN } from "./chain";

export type ContractName = "BatchRegistry" | "OliveCoin" | "PriceCapEscrow";
type Deployment = { address: string; abi: InterfaceAbi };

const all = deployments as unknown as Partial<Record<ContractName, Deployment>>;

let provider: JsonRpcProvider | null = null;

/** Read-only provider straight to Ganache: screens work before a wallet is connected. */
export function getReadProvider(): JsonRpcProvider {
  provider ??= new JsonRpcProvider(CHAIN.rpcUrl, Network.from(CHAIN.id), { staticNetwork: true });
  return provider;
}

export function getDeployment(name: ContractName): Deployment | null {
  return all[name] ?? null;
}

/** Returns null when the contract is not deployed yet. Pass a signer to send transactions. */
export function getContract(name: ContractName, runner?: ContractRunner): Contract | null {
  const d = all[name];
  return d ? new Contract(d.address, d.abi, runner ?? getReadProvider()) : null;
}

export const contractNames: ContractName[] = ["BatchRegistry", "OliveCoin", "PriceCapEscrow"];
