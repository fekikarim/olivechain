"use client";

import { useState } from "react";
import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { TxNote } from "@/components/TxNote";
import { IconBadge, IconFlask, IconSprout, IconTag, IconTransfer, OlvAmount } from "@/components/Icons";
import { Callout, Chip, Gate, Label, Panel } from "@/components/ui";
import { postRecord } from "@/lib/api";
import { hashRecord, olv, same, short, type CheckpointRecord } from "@/lib/format";
import { useSend, useTx } from "@/lib/hooks";
import { labelOf } from "@/lib/roles";
import type { BatchRow } from "./data";

type Perms = { inspector: boolean; regulator: boolean };
const EVENT_TITLE: Record<string, string> = {
  BatchMinted: "Minted",
  CustodyTransferred: "Custody passed on",
  CheckpointAdded: "Quality checkpoint",
  BatchCertified: "Certified",
  PriceRecorded: "Price recorded",
};

/** One icon and colour per history state, so each step reads at a glance. */
const EVENT_STYLE: Record<string, { Icon: typeof IconTag; cls: string }> = {
  BatchMinted: { Icon: IconSprout, cls: "bg-olive text-ground" },
  CustodyTransferred: { Icon: IconTransfer, cls: "bg-surface-2 text-deep" },
  CheckpointAdded: { Icon: IconFlask, cls: "bg-surface-2 text-deep" },
  BatchCertified: { Icon: IconBadge, cls: "bg-deep text-oil" },
  PriceRecorded: { Icon: IconTag, cls: "bg-oil text-deep" },
};

export function BatchDetail({
  row, account, accounts, perms, onChanged,
}: { row: BatchRow; account: string | null; accounts: string[] | null | undefined; perms: Perms | null; onChanged: () => void | Promise<void> }) {
  const send = useSend();
  const move = useTx(onChanged);
  const cp = useTx(onChanged);
  const cert = useTx(onChanged);
  const [to, setTo] = useState("");
  const [acidity, setAcidity] = useState("0.3");
  const [poly, setPoly] = useState("320");
  const [where, setWhere] = useState("Sfax");

  const holder = row.custodian;
  const holderName = labelOf(holder, accounts);
  const iHold = same(account, holder);
  const isInspector = !!perms?.inspector;
  const others = (accounts ?? []).filter((a) => !same(a, holder));
  const a = Number(acidity);
  const p = Number(poly);
  const cpValid = acidity.trim() !== "" && poly.trim() !== "" && Number.isFinite(a) && Number.isFinite(p) && where.trim() !== "";

  async function saveCheckpoint() {
    const record: CheckpointRecord = { batchId: row.id, acidity: a, polyphenols: p, location: where.trim(), timestamp: Math.floor(Date.now() / 1000) };
    const ok = await cp.run("Checkpoint recorded", () => send("BatchRegistry", "addCheckpoint", [row.id, hashRecord(record)]));
    if (ok) await postRecord(record);
  }

  const next = !row.certified
    ? isInspector ? "Next: record the quality checkpoint and certify the batch below." : "Next: the inspector records a checkpoint and certifies this batch."
    : iHold ? "Certified. You hold it: pass it on, or list it for sale on the Market page."
      : `Certified. Next: ${holderName} passes it on, or lists it for sale on the Market page.`;

  return (
    <>
      <div className="bg-deep p-6 text-ground md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-3xl font-extrabold tracking-tight">Batch #{row.id}</h2>
          {row.certified ? <Chip tone="ok">Certified (Extra Virgin)</Chip> : <Chip tone="warn">Not certified yet</Chip>}
        </div>
        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-bold text-ground/70">Last price</dt>
            <dd className="text-4xl font-extrabold text-oil"><OlvAmount value={olv(row.lastPrice)} size={40} className="text-oil" /></dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-ground/70">Held by</dt>
            <dd className="text-xl font-bold">{holderName} {iHold && <Chip tone="warn">you</Chip>}</dd>
            <dd className="mt-1 flex flex-wrap items-center gap-2 font-mono text-sm text-ground/80">
              {short(holder)} <CopyButton value={holder} label="Copy" />
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-bold text-ground/70">Description</dt>
            <dd className="break-all">{row.uri}</dd>
          </div>
        </dl>
      </div>

      <Callout tone="info">{next}</Callout>

      <Panel title="Pass the batch on">
        <Gate
          allowed={iHold}
          reason={!account ? "Connect MetaMask or act as a demo user to transfer." : <>Only the current holder ({holderName}) can pass this batch on. You are not the holder.</>}
        >
          <div>
            <Label htmlFor="to-pick">New holder</Label>
            <select id="to-pick" className="field" value={to} onChange={(e) => setTo(e.target.value)}>
              <option value="">Choose an account…</option>
              {others.map((o) => <option key={o} value={o}>{labelOf(o, accounts)} · {short(o)}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className="btn" disabled={!to || move.pending} onClick={() => move.run("Custody passed on", () => send("BatchRegistry", "transferCustody", [row.id, to]))}>
              Pass the batch on
            </button>
            <TxNote {...move} />
          </div>
        </Gate>
      </Panel>

      <Panel title="Inspection and certification">
        <Gate
          allowed={isInspector}
          reason={!account ? "Connect MetaMask or act as a demo user to inspect." : <>Only an inspector can record checkpoints and certify. <Link href="/people" className="font-bold underline underline-offset-4">Act as the Inspector</Link> on the People page.</>}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label htmlFor="ac">Acidity (%)</Label><input id="ac" className="field" inputMode="decimal" value={acidity} onChange={(e) => setAcidity(e.target.value)} /></div>
            <div><Label htmlFor="po">Polyphenols (mg/kg)</Label><input id="po" className="field" inputMode="decimal" value={poly} onChange={(e) => setPoly(e.target.value)} /></div>
            <div><Label htmlFor="lo">Location</Label><input id="lo" className="field" value={where} onChange={(e) => setWhere(e.target.value)} /></div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className="btn btn-ghost" disabled={!cpValid || cp.pending} onClick={saveCheckpoint}>Record checkpoint</button>
            <TxNote {...cp} />
          </div>
        </Gate>
        {!row.certified && (
          <div className="mt-6 border-t-2 border-surface-2 pt-6">
            <Gate allowed={isInspector} reason="Only an inspector can certify.">
              <div className="flex flex-wrap items-center gap-4">
                <button type="button" className="btn" disabled={cert.pending} onClick={() => cert.run("Batch certified", () => send("BatchRegistry", "certifyBatch", [row.id]))}>Certify batch</button>
                <TxNote {...cert} />
              </div>
            </Gate>
          </div>
        )}
      </Panel>

      <Panel title="History">
        <ol className="grid gap-2">
          {row.history.map((h) => {
            const st = EVENT_STYLE[h.event] ?? { Icon: IconTag, cls: "bg-surface-2 text-deep" };
            return (
              <li key={`${h.block}-${h.index}`} className="flex items-start gap-4 bg-ground p-4">
                <span className={`grid size-11 shrink-0 place-items-center ${st.cls}`}>
                  <st.Icon size={22} />
                </span>
                <div className="min-w-0">
                  <p className="font-bold">{EVENT_TITLE[h.event] ?? h.event} <span className="font-normal text-muted">· block {h.block}</span></p>
                  <p className="break-words text-sm text-muted">{describe(h.event, h.args, accounts)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Panel>
    </>
  );
}

function describe(event: string, a: Record<string, string>, accounts: string[] | null | undefined): string {
  switch (event) {
    case "BatchMinted": return `Minted by ${labelOf(a.farmer, accounts)}`;
    case "CustodyTransferred": return `${labelOf(a.from, accounts)} → ${labelOf(a.to, accounts)}`;
    case "CheckpointAdded": return `Recorded by ${labelOf(a.inspector, accounts)} (hash ${short(a.dataHash)})`;
    case "BatchCertified": return `Certified by ${labelOf(a.inspector, accounts)}`;
    case "PriceRecorded": return `${olv(a.price)} OLV`;
    default: return "";
  }
}
