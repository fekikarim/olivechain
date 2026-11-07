import { getContract } from "@/lib/contracts";

export type Batch = { id: number; custodian: string; certified: boolean; lastPrice: bigint; uri: string };
export type HistoryItem = { event: string; block: number; index: number; tx: string; args: Record<string, string> };

const EVENTS = ["BatchMinted", "CustodyTransferred", "CheckpointAdded", "BatchCertified", "PriceRecorded"] as const;

export async function loadBatch(id: number): Promise<Batch> {
  const r = getContract("BatchRegistry")!;
  const [custodian, certified, lastPrice, uri] = await Promise.all([
    r.custodianOf(id), r.isCertified(id), r.getLastPrice(id), r.tokenURI(id),
  ]);
  return { id, custodian, certified, lastPrice, uri };
}

/** Newest first. Empty when the registry is not deployed. */
export async function loadBatches(): Promise<Batch[]> {
  const r = getContract("BatchRegistry");
  if (!r) return [];
  const total = Number(await r.totalBatches());
  return Promise.all(Array.from({ length: total }, (_, i) => loadBatch(total - i)));
}

export async function loadHistory(id: number): Promise<HistoryItem[]> {
  const r = getContract("BatchRegistry")!;
  const logs = (await Promise.all(EVENTS.map((e) => r.queryFilter(r.filters[e](id), 0)))).flat();
  return logs
    .map((l) => {
      const log = l as unknown as { fragment: { name: string }; args: { toObject: () => Record<string, unknown> }; blockNumber: number; index: number; transactionHash: string };
      const args = Object.fromEntries(Object.entries(log.args.toObject()).map(([k, v]) => [k, String(v)]));
      return { event: log.fragment.name, block: log.blockNumber, index: log.index, tx: log.transactionHash, args };
    })
    .sort((a, b) => a.block - b.block || a.index - b.index);
}

export type Roles = { regulator: boolean; inspector: boolean; escrow: string };

export async function loadRoles(account: string | null): Promise<Roles & { owner: string }> {
  const r = getContract("BatchRegistry")!;
  const [owner, escrow, inspector] = await Promise.all([
    r.owner(), r.escrow(), account ? r.isInspector(account) : false,
  ]);
  return { owner, escrow, inspector, regulator: !!account && owner.toLowerCase() === account.toLowerCase() };
}
