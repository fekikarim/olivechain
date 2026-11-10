"use client";

import { useState } from "react";
import Link from "next/link";
import { TxNote } from "@/components/TxNote";
import { Callout, Chip, Gate, Label, Panel, Segmented } from "@/components/ui";

import { olv, same, short, toOlv } from "@/lib/format";
import { useLoad, useSend, useTx } from "@/lib/hooks";
import { useWallet } from "@/lib/wallet";
import { labelOf, useAccounts } from "@/lib/roles";
import { loadBatchRows, type BatchRow } from "@/features/registry/data";
import { loadMarket, type Market, type Sale } from "./data";

type Mode = "mine" | "all";

export function MarketView() {
  const { account, onOliveChain } = useWallet();
  const accounts = useAccounts();
  const market = useLoad(() => loadMarket(account), [account]);
  const rows = useLoad(loadBatchRows, []);
  const [pick, setPick] = useState<Mode | null>(null);

  const m = market.data;
  if (!m) {
    return (
      <Shell>
        <p className="bg-surface p-6">
          {market.error ?? <>OliveCoin and PriceCapEscrow are not deployed yet. Run <code>npm run migrate</code> in olive_blockchain.</>}
        </p>
      </Shell>
    );
  }

  const isAuthority = same(account, m.coinOwner);
  const who = account ? labelOf(account, accounts.data) : null;
  const heldByMe = (rows.data ?? []).filter((r) => same(r.custodian, account));
  const involved = (s: Sale) => same(account, s.seller) || same(account, s.buyer);
  const mode: Mode = pick ?? (account ? "mine" : "all");
  const sales = mode === "all" ? m.sales : m.sales.filter(involved);

  return (
    <Shell>
      <header className="py-8">
        <p className="text-sm font-bold uppercase tracking-wide text-muted">Steps 6 to 9 of the journey</p>
        <h1 className="mt-2 text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-none tracking-tighter text-deep">Market</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          {account ? `You are ${who}. ` : ""}List a batch you hold, buyers deposit OLV into the escrow, and the payment is released once the
          batch is certified and delivered.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-deep p-6 text-ground">
          <p className="text-sm font-bold text-ground/70">Your OLV</p>
          <p className="mt-1 text-4xl font-extrabold text-oil">{account ? olv(m.balance) : "—"}</p>
          <p className="mt-2 text-ground/80">{account ? `${m.symbol} in your account` : "Connect or act as a demo user to see your balance."}</p>
        </div>
        <div className="bg-surface p-6">
          <p className="text-sm font-bold text-muted">Price cap rule</p>
          <p className="mt-1 text-4xl font-extrabold text-olive">+{m.markup}%</p>
          <p className="mt-2 text-muted">A sale may be at most the last price plus {m.markup}%.</p>
        </div>
        <div className="bg-surface p-6">
          <p className="text-sm font-bold text-muted">Batches you can sell</p>
          <p className="mt-1 text-4xl font-extrabold text-olive">{heldByMe.length}</p>
          <p className="mt-2 text-muted">{heldByMe.length ? "Batches you hold right now." : "You hold no batch yet."}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <SellForm batches={heldByMe} account={account} markup={m.markup} onChanged={() => { market.reload(); rows.reload(); }} />
        <div className="grid min-w-0 content-start gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-extrabold tracking-tight">Sales</h2>
            <Segmented<Mode>
              label="Which sales to show"
              value={mode}
              onChange={setPick}
              options={[
                { value: "mine", label: `Mine (${m.sales.filter(involved).length})` },
                { value: "all", label: `All (${m.sales.length})` },
              ]}
            />
          </div>
          {!onOliveChain && account && <Callout tone="warn">Switch to OliveChain to act on sales.</Callout>}
          {sales.length === 0 && (
            <p className="bg-surface p-6 text-muted">
              {mode === "mine" ? "You are not a seller or buyer in any sale yet." : "No sales yet. A holder can list a batch on the left."}
            </p>
          )}
          {sales.map((s) => (
            <SaleCard key={s.id} sale={s} m={m} account={account} accounts={accounts.data} onChanged={market.reload} />
          ))}
        </div>
      </div>

      <div className="mt-10">
        <details className="group bg-surface">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 p-5 text-lg font-extrabold [&::-webkit-details-marker]:hidden">
            Market authority tools <span aria-hidden className="text-2xl text-olive transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="px-5 pb-6">
            <Authority m={m} allowed={isAuthority} account={account} accounts={accounts.data} onChanged={market.reload} />
          </div>
        </details>
      </div>
    </Shell>
  );
}

function SellForm({
  batches, account, markup, onChanged,
}: { batches: BatchRow[]; account: string | null; markup: number; onChanged: () => void }) {
  const send = useSend();
  const tx = useTx(onChanged);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [price, setPrice] = useState("230");
  const chosen = batches.find((b) => b.id === batchId) ?? batches[0] ?? null;
  const cap = chosen ? (chosen.lastPrice * BigInt(100 + markup)) / 100n : null;
  const p = toOlv(price);
  const over = !!p && !!cap && p > cap;
  const allowed = !!account && batches.length > 0;

  return (
    <Panel title="List a batch for sale">
      <Gate
        allowed={allowed}
        reason={!account
          ? "Connect MetaMask or act as a demo user to list a batch."
          : <>You hold no batch to sell. The holder of a batch lists it. Pass a batch to this account on the Registry page, or use the guided demo.</>}
      >
        <div>
          <Label htmlFor="sell-batch">Batch to sell</Label>
          <select id="sell-batch" className="field" value={chosen?.id ?? ""} onChange={(e) => setBatchId(Number(e.target.value))}>
            {batches.map((b) => <option key={b.id} value={b.id}>Batch #{b.id} · last price {olv(b.lastPrice)} OLV</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="sell-price">Sale price (OLV)</Label>
          <input id="sell-price" className="field" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="bg-ground p-4">
          <p className="font-semibold">Highest allowed price: {cap !== null ? `${olv(cap)} OLV` : "—"}</p>
          <p className="mt-1 text-sm text-muted">Last price plus {markup}%. Above that, the escrow refuses the sale.</p>
        </div>
        {over && <Callout tone="bad">That price is above the cap. The escrow would refuse it.</Callout>}
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="btn"
            disabled={!p || over || !chosen || tx.pending}
            onClick={() => tx.run("Listed for sale", () => send("PriceCapEscrow", "createSale", [chosen!.id, p!]))}
          >
            List for {p ? olv(p) : "…"} OLV
          </button>
          <TxNote {...tx} />
        </div>
      </Gate>
    </Panel>
  );
}

const STATE_CHIP: Record<string, { tone: "neutral" | "ok" | "warn" | "bad"; text: string }> = {
  Created: { tone: "neutral", text: "Listed" },
  Deposited: { tone: "warn", text: "Paid into escrow" },
  Released: { tone: "ok", text: "Paid out" },
  Refunded: { tone: "bad", text: "Refunded" },
  Cancelled: { tone: "bad", text: "Cancelled" },
};

function SaleCard({
  sale: s, m, account, accounts, onChanged,
}: { sale: Sale; m: Market; account: string | null; accounts: string[] | null | undefined; onChanged: () => void }) {
  const send = useSend();
  const tx = useTx(onChanged);
  const isSeller = same(account, s.seller);
  const isBuyer = same(account, s.buyer);
  const certified = s.certified;
  const custodyWithBuyer = same(s.custodian, s.buyer);
  const ready = certified && custodyWithBuyer;
  const chip = STATE_CHIP[s.state] ?? STATE_CHIP.Created;
  const enough = m.balance >= s.price;

  async function depositFlow() {
    await tx.run("Payment deposited", async () => {
      if (m.allowance < s.price) {
        const approval = await send("OliveCoin", "approve", [m.escrowAddress, s.price]);
        await approval.wait();
      }
      return send("PriceCapEscrow", "deposit", [s.id]);
    });
  }

  return (
    <article className="bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xl font-extrabold">Sale #{s.id} · Batch #{s.batchId}</p>
          <p className="text-2xl font-extrabold text-olive">{olv(s.price)} OLV</p>
        </div>
        <Chip tone={chip.tone}>{chip.text}</Chip>
      </div>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div><dt className="font-bold text-muted">Seller</dt><dd>{labelOf(s.seller, accounts)}{isSeller && " (you)"}</dd></div>
        <div><dt className="font-bold text-muted">Buyer</dt><dd>{s.buyer === "0x0000000000000000000000000000000000000000" ? "Not yet" : labelOf(s.buyer, accounts)}{isBuyer && " (you)"}</dd></div>
      </dl>

      {s.state === "Deposited" && (
        <ul className="mt-4 grid gap-1 text-sm">
          <li className={certified ? "font-bold text-olive" : "text-muted"}>{certified ? "✓" : "○"} Batch certified</li>
          <li className={custodyWithBuyer ? "font-bold text-olive" : "text-muted"}>{custodyWithBuyer ? "✓" : "○"} Buyer holds the batch</li>
        </ul>
      )}

      {s.state === "Created" && (
        <div className="mt-5 grid gap-3">
          <Gate allowed={!!account && !isSeller} reason={!account ? "Connect or act as a demo user to pay." : "You listed this sale. A buyer pays, so act as the grocery or another buyer."}>
            {!enough && account && <Callout tone="bad">Not enough OLV to pay {olv(s.price)}. Ask the market authority to mint OLV.</Callout>}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn" disabled={!enough || tx.pending} onClick={depositFlow}>Pay {olv(s.price)} OLV into escrow</button>
            </div>
          </Gate>
          <Gate allowed={isSeller} reason="Only the seller can cancel a sale that has not been paid.">
            <div><button type="button" className="btn btn-ghost" disabled={tx.pending} onClick={() => tx.run("Sale cancelled", () => send("PriceCapEscrow", "cancelSale", [s.id]))}>Cancel sale</button></div>
          </Gate>
        </div>
      )}

      {s.state === "Deposited" && (
        <div className="mt-5 grid gap-3">
          <Gate
            allowed={!!account && ready}
            reason={!account ? "Connect or act as a demo user to release." : "Release unlocks when the batch is certified and the buyer holds it (see the checklist above)."}
          >
            <div><button type="button" className="btn" disabled={tx.pending} onClick={() => tx.run("Payment released", () => send("PriceCapEscrow", "releasePayment", [s.id]))}>Release payment to the seller</button></div>
          </Gate>
          <Gate allowed={isBuyer && !ready} reason={isBuyer ? "Refund is blocked: the batch is certified and with you, so release it instead." : "Only the buyer can take the money back."}>
            <div><button type="button" className="btn btn-ghost" disabled={tx.pending} onClick={() => tx.run("Refunded", () => send("PriceCapEscrow", "refund", [s.id]))}>Refund my payment</button></div>
          </Gate>
        </div>
      )}
      <div className="mt-3"><TxNote {...tx} /></div>
    </article>
  );
}

function Authority({
  m, allowed, account, accounts, onChanged,
}: { m: Market; allowed: boolean; account: string | null; accounts: string[] | null | undefined; onChanged: () => void }) {
  const send = useSend();
  const mint = useTx(onChanged);
  const markup = useTx(onChanged);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("1000");
  const [percent, setPercent] = useState(String(m.markup));
  const amt = toOlv(amount);
  const pct = Number(percent);
  const target = to || account || "";
  return (
    <Gate allowed={allowed} reason={!account ? "Connect or act as a demo user first." : <>Only the market authority (the regulator account, {short(m.coinOwner)}) can mint OLV or change the markup.</>}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="grid gap-3">
          <Label htmlFor="mint-to">Mint OLV to</Label>
          <select id="mint-to" className="field" value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">The account you are using</option>
            {(accounts ?? []).map((a) => <option key={a} value={a}>{labelOf(a, accounts)}</option>)}
          </select>
          <Label htmlFor="mint-amt">Amount (OLV)</Label>
          <input id="mint-amt" className="field" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button type="button" className="btn" disabled={!amt || !target || mint.pending} onClick={() => mint.run("OLV minted", () => send("OliveCoin", "mint", [target, amt!]))}>Mint OLV</button>
          <TxNote {...mint} />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="markup">Max markup in % (now {m.markup}%)</Label>
          <input id="markup" className="field" inputMode="numeric" value={percent} onChange={(e) => setPercent(e.target.value)} />
          <button type="button" className="btn" disabled={!Number.isInteger(pct) || pct < 0 || pct > 1000 || markup.pending} onClick={() => markup.run("Markup changed", () => send("PriceCapEscrow", "setMaxMarkup", [pct]))}>Save markup</button>
          <TxNote {...markup} />
        </div>
      </div>
    </Gate>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-[1280px] px-5 pb-16 md:px-8">{children}</div>;
}

