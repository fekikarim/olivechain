"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { TxNote } from "@/components/TxNote";
import { RoleAvatar } from "@/components/Icons";
import { Label } from "@/components/ui";
import type { RoleKey } from "@/lib/roles";
import { postRecord } from "@/lib/api";
import { getContract } from "@/lib/contracts";
import { hashRecord, olv, same, short, toOlv, type CheckpointRecord } from "@/lib/format";
import { useLoad, useSend, useTx } from "@/lib/hooks";
import type { Sale } from "@/features/payment/data";
import type { Status } from "./logic";

type Done = () => void | Promise<void>;

const BADGE: Record<Status, { text: string; cls: string }> = {
  done: { text: "Done ✓", cls: "bg-olive text-ground" },
  active: { text: "Your turn", cls: "bg-oil text-deep" },
  optional: { text: "Optional", cls: "bg-surface-2 text-deep" },
  waiting: { text: "Locked", cls: "bg-surface-2 text-muted" },
};

type CardProps = {
  title: string;
  what: string;
  expect: string;
  who: string;
  role: RoleKey | null;
  address: string | null;
  account: string | null;
  onOliveChain: boolean;
  canAct: boolean;
  status: Status;
  lockedBy?: string;
  onActAs?: () => void;
  children?: ReactNode;
};

/** One step of the demo. Actions stay disabled until the right account is in use, and the card says how to switch. */
export function StepCard(p: CardProps) {
  const badge = BADGE[p.status];
  const blocker = !p.account
    ? "Nobody is signed in yet. Act as the required person, or connect MetaMask."
    : !p.onOliveChain
      ? "Switch MetaMask to OliveChain (top right)."
      : !p.canAct && p.address
        ? `This step needs ${p.who}. You are using another account.`
        : null;

  return (
    <article aria-label={p.title} className="bg-surface p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight">{p.title}</h2>
        <span className={`px-3 py-1 text-sm font-bold ${badge.cls}`}>{badge.text}</span>
      </div>
      <p className="mt-3 text-lg">{p.what}</p>

      {p.status === "waiting" && <p className="mt-5 bg-surface-2 p-4 font-medium">Locked. Finish &ldquo;{p.lockedBy}&rdquo; first.</p>}
      {p.status === "done" && <p className="mt-5 font-semibold text-olive">Complete. Nothing to do here.</p>}

      {(p.status === "active" || p.status === "optional") && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 bg-ground p-4">
            <RoleAvatar role={p.role} size={36} />
            <span className="font-extrabold">Use the account: {p.who}</span>
            {p.address && (
              <>
                <span className="break-all font-mono text-sm">{short(p.address)}</span>
                <CopyButton value={p.address} label="Copy address" />
              </>
            )}
          </div>
          <p className="mt-4 text-muted">
            <span className="font-bold text-ink">You should see: </span>
            {p.expect}
          </p>
          {blocker && (
            <div role="status" className="mt-4 flex flex-wrap items-center gap-3 bg-oil p-4 font-semibold text-deep">
              <span>{blocker}</span>
              {p.address && p.onActAs && (
                <button type="button" className="btn btn-light min-h-10" onClick={p.onActAs}>Act as {p.who}</button>
              )}
              <Link href="/people" className="underline underline-offset-4">Choose another person</Link>
            </div>
          )}
          <fieldset disabled={!p.canAct} className="mt-5 grid min-w-0 gap-4 border-0 p-0">
            {p.children}
          </fieldset>
        </>
      )}
    </article>
  );
}

export function MintStep({ account, onDone }: { account: string | null; onDone: Done }) {
  const send = useSend();
  const tx = useTx(onDone);
  const [uri, setUri] = useState("ipfs://olivechain/chemlali-500kg");
  const [price, setPrice] = useState("200");
  const p = toOlv(price);
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="mint-price">Declared price (OLV)</Label>
          <input id="mint-price" className="field" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="mint-uri">Batch description (variety, farm, harvest, litres)</Label>
          <input id="mint-uri" className="field" value={uri} onChange={(e) => setUri(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="btn"
          disabled={!p || !uri.trim() || tx.pending}
          onClick={() => tx.run("Batch minted", () => send("BatchRegistry", "mintBatch", [account, uri.trim(), p!]))}
        >
          Mint the batch
        </button>
        <TxNote {...tx} />
      </div>
    </>
  );
}

export function HandStep({ batchId, to, toName, onDone }: { batchId: number; to: string; toName: string; onDone: Done }) {
  const send = useSend();
  const tx = useTx(onDone);
  return (
    <>
      <p>
        The batch moves to the <b>{toName}</b> account (<span className="font-mono text-sm">{short(to)}</span>).
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="btn"
          disabled={tx.pending}
          onClick={() => tx.run(`Handed to the ${toName.toLowerCase()}`, () => send("BatchRegistry", "transferCustody", [batchId, to]))}
        >
          Hand over to {toName}
        </button>
        <TxNote {...tx} />
      </div>
    </>
  );
}

export function CertifyStep({ batchId, hasCheckpoint, onDone }: { batchId: number; hasCheckpoint: boolean; onDone: Done }) {
  const send = useSend();
  const cp = useTx(onDone);
  const cert = useTx(onDone);
  const [acidity, setAcidity] = useState("0.3");
  const [poly, setPoly] = useState("320");
  const [where, setWhere] = useState("Sfax");
  const a = Number(acidity);
  const p = Number(poly);
  const valid = acidity.trim() !== "" && poly.trim() !== "" && Number.isFinite(a) && Number.isFinite(p) && where.trim() !== "";

  async function saveCheckpoint() {
    const record: CheckpointRecord = { batchId, acidity: a, polyphenols: p, location: where.trim(), timestamp: Math.floor(Date.now() / 1000) };
    const ok = await cp.run("Checkpoint recorded", () => send("BatchRegistry", "addCheckpoint", [batchId, hashRecord(record)]));
    if (ok) await postRecord(record);
  }

  return (
    <>
      <div>
        <p className="font-extrabold">
          A. Quality checkpoint {hasCheckpoint && <span className="font-semibold text-olive">(already recorded ✓)</span>}
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div><Label htmlFor="ac">Acidity (%)</Label><input id="ac" className="field" inputMode="decimal" value={acidity} onChange={(e) => setAcidity(e.target.value)} /></div>
          <div><Label htmlFor="po">Polyphenols (mg/kg)</Label><input id="po" className="field" inputMode="decimal" value={poly} onChange={(e) => setPoly(e.target.value)} /></div>
          <div><Label htmlFor="lo">Location</Label><input id="lo" className="field" value={where} onChange={(e) => setWhere(e.target.value)} /></div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <button type="button" className="btn btn-ghost" disabled={!valid || cp.pending} onClick={saveCheckpoint}>Record checkpoint</button>
          <TxNote {...cp} />
        </div>
      </div>
      <div>
        <p className="font-extrabold">B. Certify the batch</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <button type="button" className="btn" disabled={cert.pending} onClick={() => cert.run("Batch certified", () => send("BatchRegistry", "certifyBatch", [batchId]))}>
            Certify batch
          </button>
          <TxNote {...cert} />
        </div>
      </div>
    </>
  );
}

export function TryUnfairStep({ batchId, onDone }: { batchId: number; onDone: Done }) {
  const send = useSend();
  const tx = useTx(onDone);
  const blocked = !!tx.error && !tx.error.includes("rejected");
  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={tx.pending}
          onClick={() =>
            tx.run("Sale created", async () => {
              const cap = (await getContract("PriceCapEscrow")!.priceCap(batchId)) as bigint;
              return send("PriceCapEscrow", "createSale", [batchId, cap + toOlv("10")!]);
            })
          }
        >
          Try a price 10 OLV above the cap
        </button>
        <TxNote {...tx} />
      </div>
      {blocked && <p className="font-semibold">This is the rule working: nothing was listed and no OLV moved. Continue with the next step.</p>}
    </>
  );
}

export function ListStep({ batchId, lastPrice, onDone }: { batchId: number; lastPrice: bigint; onDone: Done }) {
  const send = useSend();
  const tx = useTx(onDone);
  const [price, setPrice] = useState("230");
  const cap = useLoad(() => getContract("PriceCapEscrow")!.priceCap(batchId) as Promise<bigint>, [batchId]);
  const p = toOlv(price);
  const capValue = cap.data;
  const over = !!p && capValue !== null && capValue !== undefined && p > capValue;
  return (
    <>
      <p className="text-muted">
        Last recorded price: <b className="text-ink">{olv(lastPrice)} OLV</b>. Highest price the escrow allows:{" "}
        <b className="text-ink">{capValue != null ? `${olv(capValue)} OLV` : "…"}</b>.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="list-price">Sale price (OLV)</Label>
          <input id="list-price" className="field" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
      </div>
      {over && <p role="alert" className="font-semibold text-bad">Above the cap. The escrow would refuse this price.</p>}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="btn"
          disabled={!p || over || tx.pending}
          onClick={() => tx.run("Listed for sale", () => send("PriceCapEscrow", "createSale", [batchId, p!]))}
        >
          List for {p ? olv(p) : "…"} OLV
        </button>
        <TxNote {...tx} />
      </div>
    </>
  );
}

export function DepositStep({
  sale, balance, allowance, escrow, onDone,
}: { sale: Sale; balance: bigint; allowance: bigint; escrow: string; onDone: Done }) {
  const send = useSend();
  const tx = useTx(onDone);
  const enough = balance >= sale.price;
  const needsApproval = allowance < sale.price;
  return (
    <>
      <p className="text-muted">
        Your OLV balance: <b className="text-ink">{olv(balance)} OLV</b>. Price: <b className="text-ink">{olv(sale.price)} OLV</b>.
      </p>
      {!enough && <p role="alert" className="font-semibold text-bad">Not enough OLV. Ask the market authority to mint OLV to this account on the Market page.</p>}
      <p className="text-sm text-muted">
        {needsApproval ? "MetaMask (or the demo signer) asks twice: first the approval, then the deposit." : "The escrow is already approved, so only the deposit is needed."}
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="btn"
          disabled={!enough || tx.pending}
          onClick={() =>
            tx.run("Payment deposited", async () => {
              if (needsApproval) {
                const approval = await send("OliveCoin", "approve", [escrow, sale.price]);
                await approval.wait();
              }
              return send("PriceCapEscrow", "deposit", [sale.id]);
            })
          }
        >
          Deposit {olv(sale.price)} OLV
        </button>
        <TxNote {...tx} />
      </div>
    </>
  );
}

function Check({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className="flex gap-2">
      <span aria-hidden className={ok ? "font-bold text-olive" : "text-muted"}>{ok ? "✓" : "○"}</span>
      <span className={ok ? "" : "text-muted"}>{text}{ok ? "" : " (not yet)"}</span>
    </li>
  );
}

export function ReleaseStep({
  sale, certified, custodyWithBuyer, onDone,
}: { sale: Sale; certified: boolean; custodyWithBuyer: boolean; onDone: Done }) {
  const send = useSend();
  const tx = useTx(onDone);
  const ready = certified && custodyWithBuyer;
  return (
    <>
      <ul className="grid gap-1">
        <Check ok={certified} text="The inspector certified the batch" />
        <Check ok={custodyWithBuyer} text="The grocery holds the batch" />
      </ul>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="btn"
          disabled={!ready || tx.pending}
          onClick={() => tx.run("Payment released", () => send("PriceCapEscrow", "releasePayment", [sale.id]))}
        >
          Release {olv(sale.price)} OLV to the distributor
        </button>
        <TxNote {...tx} />
      </div>
    </>
  );
}

export function CompleteBox({ batchId, price }: { batchId: number; price: bigint | null }) {
  return (
    <article className="bg-deep p-6 text-ground md:p-8">
      <h2 className="text-3xl font-extrabold tracking-tight">Scenario complete</h2>
      <p className="mt-3 text-lg text-ground/90">
        Batch #{batchId} travelled from the farmer to the grocery.
        {price !== null && <> It sold for {olv(price)} OLV, and that price is now its last price.</>}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/registry" className="btn btn-light">See the batch in Batches</Link>
        <Link href="/market" className="btn btn-quiet">See the sale in Market</Link>
      </div>
      <p className="mt-5 text-ground/80">Want another run? Mint a new batch below. The steps start again for the new batch.</p>
    </article>
  );
}

