import { formatUnits, Interface, keccak256, parseUnits, toUtf8Bytes } from "ethers";
import { getContract, contractNames } from "./contracts";

export const ZERO = "0x0000000000000000000000000000000000000000";

export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
export const same = (a?: string | null, b?: string | null) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

/** OLV base units (18 decimals) → "230.0". */
export const olv = (v: bigint | string) => {
  const s = formatUnits(v, 18);
  const [i, d = ""] = s.split(".");
  return `${Number(i).toLocaleString("en-US")}${d && d !== "0" ? "." + d.slice(0, 4) : ""}`;
};
export const toOlv = (s: string): bigint | null => {
  try { const v = parseUnits(s.trim(), 18); return v > 0n ? v : null; } catch { return null; }
};

const FRIENDLY: Record<string, string> = {
  NotInspector: "Only an inspector can do this.",
  NotEscrow: "Only the escrow contract can do this.",
  OwnableUnauthorizedAccount: "Only the regulator / market authority can do this.",
  ERC721IncorrectOwner: "You are not the current custodian of this batch.",
  ERC721NonexistentToken: "That batch does not exist.",
  ERC721InvalidReceiver: "Invalid receiving address.",
  AlreadyCertified: "This batch is already certified.",
  ZeroAddress: "The address cannot be zero.",
  ZeroPrice: "The price must be greater than zero.",
  PriceAboveCap: "Price is above the markup cap.",
  NotCustodian: "You are not the custodian of this batch.",
  NotSeller: "Only the seller can do this.",
  NotBuyer: "Only the buyer can do this.",
  WrongState: "The sale is not in the right state for this action.",
  SelfSale: "You cannot buy your own sale.",
  NotCertified: "The batch is not certified yet.",
  CustodyNotMoved: "Custody has not moved to the buyer yet.",
  ConditionsMet: "Delivery conditions are met: release the payment instead.",
  ERC20InsufficientAllowance: "Not enough OLV allowance for the escrow.",
  ERC20InsufficientBalance: "Not enough OLV balance.",
  InvalidMarkup: "Markup must be between 0 and 1000 %.",
};

/** Turns an ethers error into one readable line, including decoded custom errors. */
export function errorMessage(e: unknown): string {
  const err = e as { code?: string; info?: { error?: { data?: string } }; data?: string; error?: { data?: string }; shortMessage?: string; message?: string };
  if (err.code === "ACTION_REJECTED") return "Transaction rejected in MetaMask.";
  const data = [err.data, err.error?.data, err.info?.error?.data].find((d) => typeof d === "string" && d.length >= 10);
  if (data) {
    for (const name of contractNames) {
      const abi = getContract(name)?.interface;
      const parsed = abi && (abi as Interface).parseError(data);
      if (parsed) return `Reverted: ${FRIENDLY[parsed.name] ?? parsed.name} (${parsed.name})`;
    }
  }
  return err.shortMessage ?? err.message ?? "Unknown error";
}

/** Same canonical hash as olive_backend/src/records.js: keys sorted alphabetically. */
export type CheckpointRecord = { batchId: number; acidity: number; polyphenols: number; location: string; timestamp: number };
export const canonicalJson = (r: CheckpointRecord) =>
  JSON.stringify(Object.fromEntries(Object.entries(r).sort(([a], [b]) => (a < b ? -1 : 1))));
export const hashRecord = (r: CheckpointRecord) => keccak256(toUtf8Bytes(canonicalJson(r)));
