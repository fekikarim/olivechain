"use client";

import { useEffect, useState } from "react";
import { isAddress } from "ethers";
import { Panel, Label } from "@/components/Section";
import { TxNote } from "@/components/TxNote";
import { useLoad, useTx, useWrite } from "@/lib/hooks";
import { useWallet } from "@/lib/wallet";
import { hashRecord, olv, same, short, canonicalJson, type CheckpointRecord } from "@/lib/format";
import { getRecord, postRecord } from "@/lib/api";
import { loadBatch, loadHistory, type HistoryItem } from "./data";

const TITLES: Record<string, string> = {
  BatchMinted: "Minted",
  CustodyTransferred: "Custody transferred",
  CheckpointAdded: "Quality checkpoint",
  BatchCertified: "Certified",
  PriceRecorded: "Price recorded",
};

function describe(h: HistoryItem, record?: CheckpointRecord | null): string {
  const a = h.args;
  switch (h.event) {
    case "BatchMinted": return `farmer ${short(a.farmer)} → custodian ${short(a.custodian)}`;
    case "CustodyTransferred": return `${short(a.from)} → ${short(a.to)}`;
    case "CheckpointAdded":
      return record
        ? `acidity ${record.acidity}%, polyphenols ${record.polyphenols} mg/kg, ${record.location}, by ${short(a.inspector)}`
        : `hash ${short(a.dataHash)} by ${short(a.inspector)}`;
    case "BatchCertified": return `inspector ${short(a.inspector)}`;
    case "PriceRecorded": return `${olv(a.price)} OLV`;
    default: return "";
  }
}

export function BatchDetail({ id, isInspector, onChanged }: { id: number; isInspector: boolean; onChanged: () => void }) {
  const { account } = useWallet();
  const write = useWrite();
  const batch = useLoad(() => loadBatch(id), [id]);
  const history = useLoad(() => loadHistory(id), [id]);
  const [records, setRecords] = useState<Record<string, CheckpointRecord | null>>({});
  const [next, setNext] = useState("");
  const [acidity, setAcidity] = useState("0.3");
  const [poly, setPoly] = useState("320");
  const [where, setWhere] = useState("Sfax");
  const [lastRecord, setLastRecord] = useState<{ record: CheckpointRecord; hash: string } | null>(null);

  const refresh = async () => { await Promise.all([batch.reload(), history.reload()]); onChanged(); };
  const move = useTx(refresh);
  const check = useTx(refresh);
  const cert = useTx(refresh);

  useEffect(() => {
    const hashes = (history.data ?? []).filter((h) => h.event === "CheckpointAdded").map((h) => h.args.dataHash);
    hashes.forEach((hash) => getRecord(hash).then((r) => setRecords((prev) => ({ ...prev, [hash]: r }))));
  }, [history.data]);

  const b = batch.data;
  if (!b) return <Panel title={`Batch #${id}`}><p>{batch.error ?? "Loading…"}</p></Panel>;
  const isCustodian = same(account, b.custodian);
  const acidityN = Number(acidity), polyN = Number(poly);
  const recordValid = acidity !== "" && poly !== "" && Number.isFinite(acidityN) && Number.isFinite(polyN) && where.trim() !== "";

  async function addCheckpoint() {
    const record: CheckpointRecord = { batchId: id, acidity: acidityN, polyphenols: polyN, location: where.trim(), timestamp: Math.floor(Date.now() / 1000) };
    const hash = hashRecord(record);
    const ok = await check.run("Checkpoint recorded", async () => (await write("BatchRegistry")).addCheckpoint(id, hash));
    if (ok) { await postRecord(record); setLastRecord({ record, hash }); history.reload(); }
  }

  return (
    <div className="grid gap-4">
      <Panel title={`Batch #${id}`} tone="deep">
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <div><dt className="text-sm text-ground/70">Custodian</dt><dd className="break-all font-semibold">{b.custodian}{isCustodian && " (you)"}</dd></div>
          <div><dt className="text-sm text-ground/70">Last price</dt><dd className="text-3xl font-extrabold text-oil">{olv(b.lastPrice)} OLV</dd></div>
          <div><dt className="text-sm text-ground/70">Quality</dt><dd className="font-semibold">{b.certified ? "Certified (Extra Virgin)" : "Not certified"}</dd></div>
          <div><dt className="text-sm text-ground/70">Metadata</dt><dd className="break-all">{b.uri}</dd></div>
        </dl>
      </Panel>

      <Panel title="Transfer custody">
        {!isCustodian && <p className="mb-3 bg-surface-2 p-3 text-sm font-medium">You are not the custodian: the contract will reject this.</p>}
        <Label htmlFor="next">New custodian address</Label>
        <input id="next" className="field" placeholder="0x…" value={next} onChange={(e) => setNext(e.target.value.trim())} />
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <button className="btn" disabled={!isAddress(next) || move.pending} onClick={() => move.run("Custody transferred", async () => (await write("BatchRegistry")).transferCustody(id, next))}>Transfer</button>
          <TxNote {...move} />
        </div>
      </Panel>

      <Panel title="Quality checkpoint">
        {!isInspector && <p className="mb-3 bg-surface-2 p-3 text-sm font-medium">You are not an inspector: the contract will reject this.</p>}
        <div className="grid gap-4 sm:grid-cols-3">
          <div><Label htmlFor="ac">Acidity (%)</Label><input id="ac" className="field" inputMode="decimal" value={acidity} onChange={(e) => setAcidity(e.target.value)} /></div>
          <div><Label htmlFor="po">Polyphenols (mg/kg)</Label><input id="po" className="field" inputMode="decimal" value={poly} onChange={(e) => setPoly(e.target.value)} /></div>
          <div><Label htmlFor="lo">Location</Label><input id="lo" className="field" value={where} onChange={(e) => setWhere(e.target.value)} /></div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <button className="btn" disabled={!recordValid || check.pending} onClick={addCheckpoint}>Add checkpoint</button>
          <TxNote {...check} />
        </div>
        {lastRecord && (
          <div className="mt-4 bg-surface-2 p-3 text-sm">
            <p className="font-semibold">Off-chain record (kept by the backend)</p>
            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all">{canonicalJson(lastRecord.record)}</pre>
            <p className="mt-1 break-all">On-chain hash: {lastRecord.hash}</p>
          </div>
        )}
      </Panel>

      {!b.certified && (
        <Panel title="Certify batch">
          {!isInspector && <p className="mb-3 bg-surface-2 p-3 text-sm font-medium">You are not an inspector: the contract will reject this.</p>}
          <div className="flex flex-wrap items-center gap-4">
            <button className="btn" disabled={cert.pending} onClick={() => cert.run("Batch certified", async () => (await write("BatchRegistry")).certifyBatch(id))}>Certify</button>
            <TxNote {...cert} />
          </div>
        </Panel>
      )}

      <Panel title="History">
        {history.loading ? <p>Loading…</p> : (
          <ol className="grid gap-2">
            {(history.data ?? []).map((h) => (
              <li key={`${h.block}-${h.index}`} className="bg-ground p-3">
                <p className="font-semibold">{TITLES[h.event] ?? h.event} <span className="font-normal text-muted">· block {h.block}</span></p>
                <p className="break-words text-sm text-muted">{describe(h, h.event === "CheckpointAdded" ? records[h.args.dataHash] : undefined)}</p>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}
