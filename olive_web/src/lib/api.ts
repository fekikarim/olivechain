import { API_URL } from "./chain";
import type { CheckpointRecord } from "./format";

/** Stores the off-chain checkpoint record in the backend. Best effort: the chain is the source of truth. */
export async function postRecord(r: CheckpointRecord): Promise<{ hash: string } | null> {
  try {
    const res = await fetch(`${API_URL}/api/records`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(r) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function getRecord(hash: string): Promise<CheckpointRecord | null> {
  try {
    const res = await fetch(`${API_URL}/api/records/${hash}`);
    return res.ok ? (await res.json()).record : null;
  } catch {
    return null;
  }
}
