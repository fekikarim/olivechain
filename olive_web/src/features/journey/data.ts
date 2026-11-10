import { getContract } from "@/lib/contracts";
import { loadBatch, loadHistory, type Batch, type HistoryItem } from "@/features/registry/data";
import { loadMarket, type Market } from "@/features/payment/data";
import type { Facts } from "./logic";

/** Set when the user chooses "Start from step 1": batches up to this number are not part of the demo. */
const KEY = "olivechain.demo-start";
export const RESTART_EVENT = "olive-demo-restart";

export function getDemoStart(): number {
  try {
    return Number(localStorage.getItem(KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

export function startDemoFrom(total: number) {
  try {
    localStorage.setItem(KEY, String(total));
  } catch {
    /* storage blocked: the demo keeps the current batch */
  }
  window.dispatchEvent(new Event(RESTART_EVENT));
}

/** id 0 means "no batch in this demo run yet". The chain keeps every batch either way. */
export type Scenario = { id: number; total: number; batch: Batch | null; history: HistoryItem[]; market: Market | null };

/** Reads the newest batch of the current demo run and its market data. Null if not deployed. */
export async function loadScenario(account: string | null): Promise<Scenario | null> {
  const reg = getContract("BatchRegistry");
  if (!reg) return null;
  const total = Number(await reg.totalBatches());
  const market = await loadMarket(account);
  const id = total > getDemoStart() ? total : 0;
  if (id === 0) return { id, total, batch: null, history: [], market };
  const [batch, history] = await Promise.all([loadBatch(id), loadHistory(id)]);
  return { id, total, batch, history, market };
}

export function factsFrom(s: Scenario, addr: Record<"farmer" | "mill" | "distributor" | "grocery", string>): Facts {
  const sale = s.market?.sales.find((x) => x.batchId === s.id && x.state !== "Cancelled") ?? null;
  return {
    hasBatch: !!s.batch,
    custodian: s.batch?.custodian ?? null,
    certified: !!s.batch?.certified,
    sale: sale ? { state: sale.state } : null,
    addr: { farmer: addr.farmer, mill: addr.mill, distributor: addr.distributor, grocery: addr.grocery },
  };
}
