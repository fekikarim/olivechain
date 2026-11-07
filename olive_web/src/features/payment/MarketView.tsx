"use client";

import { useState } from "react";
import { isAddress } from "ethers";
import { Panel, Label } from "@/components/Section";
import { TxNote } from "@/components/TxNote";
import { getContract } from "@/lib/contracts";
import { useLoad, useTx, useWrite } from "@/lib/hooks";
import { useWallet } from "@/lib/wallet";
import { olv, toOlv, same, short } from "@/lib/format";
import { loadMarket, type Market, type Sale } from "./data";

const stateTone: Record<string, string> = {
  Created: "bg-surface-2 text-deep", Deposited: "bg-oil text-deep", Released: "bg-olive text-ground",
  Refunded: "bg-muted text-ground", Cancelled: "bg-muted text-ground",
};

export function MarketView() {
  const { account } = useWallet();
  const market = useLoad(() => loadMarket(account), [account]);
  const m = market.data;

  if (market.loading) return <p className="mx-auto max-w-[1280px] px-5 py-12 md:px-8">Loading…</p>;
  if (!m) {
    return <p className="mx-auto max-w-[1280px] px-5 py-12 md:px-8">{market.error ?? <>OliveCoin / PriceCapEscrow are not deployed yet. Run <code>npm run migrate</code> in <code>olive_blockchain</code>.</>}</p>;
  }

  return (
    <div className="mx-auto max-w-[1280px] px-5 pb-8 md:px-8">
      <div className="flex flex-wrap items-baseline gap-4 py-8">
        <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-none tracking-tighter text-deep">Market</h1>
        {same(account, m.escrowOwner) && <span className="bg-olive px-3 py-1 text-sm font-semibold text-ground">market authority</span>}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Your OLV" tone="deep">
          <p className="text-5xl font-extrabold text-oil">{account ? olv(m.balance) : "—"}</p>
          <p className="mt-1 text-ground/80">{account ? `${m.symbol} in ${short(account)}` : "Connect MetaMask to see your balance."}</p>
        </Panel>
        <AuthorityPanel m={m} account={account} onChanged={market.reload} />
        <CreateSale onChanged={market.reload} markup={m.markup} />
      </div>

      <h2 className="mb-3 mt-10 text-2xl font-bold tracking-tight">Sales</h2>
      {m.sales.length === 0 && <p className="bg-surface p-6 text-muted">No sales yet. A custodian can list a batch above.</p>}
      <ul className="grid gap-3">
        {m.sales.map((s) => <SaleRow key={s.id} sale={s} m={m} account={account} onChanged={market.reload} />)}
      </ul>
    </div>
  );
}

function AuthorityPanel({ m, account, onChanged }: { m: Market; account: string | null; onChanged: () => void }) {
  const write = useWrite();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("1000");
  const [markup, setMarkup] = useState(String(m.markup));
  const tx = useTx(onChanged);
  const authority = same(account, m.coinOwner);
  const amountWei = toOlv(amount);
  const markupN = Number(markup);

  return (
    <Panel title="Market authority">
      {!authority && <p className="mb-3 bg-surface-2 p-3 text-sm font-medium">You are not the market authority ({short(m.coinOwner)}): the contracts will reject these actions.</p>}
      <Label htmlFor="mint-olv-to">Mint OLV to</Label>
      <input id="mint-olv-to" className="field" placeholder={account ?? "0x…"} value={to} onChange={(e) => setTo(e.target.value.trim())} />
      <div className="mt-2 flex gap-2">
        <input aria-label="Amount of OLV" className="field" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button className="btn" disabled={!amountWei || tx.pending || !(to || account) || (!!to && !isAddress(to))} onClick={() => tx.run("OLV minted", async () => (await write("OliveCoin")).mint(to || account, amountWei!))}>Mint</button>
      </div>
      <Label htmlFor="markup"><span className="mt-4 block">Max markup (now {m.markup} %)</span></Label>
      <div className="flex gap-2">
        <input id="markup" className="field" inputMode="numeric" value={markup} onChange={(e) => setMarkup(e.target.value)} />
        <button className="btn" disabled={!Number.isInteger(markupN) || markupN < 0 || markupN > 1000 || tx.pending} onClick={() => tx.run("Markup changed", async () => (await write("PriceCapEscrow")).setMaxMarkup(markupN))}>Set</button>
      </div>
      <div className="mt-3"><TxNote {...tx} /></div>
    </Panel>
  );
}

function CreateSale({ onChanged, markup }: { onChanged: () => void; markup: number }) {
  const write = useWrite();
  const [batch, setBatch] = useState("1");
  const [price, setPrice] = useState("230");
  const batchN = Number(batch);
  const priceWei = toOlv(price);
  const info = useLoad(async () => {
    if (!Number.isInteger(batchN) || batchN < 1) return null;
    try {
      const cap = (await getContract("PriceCapEscrow")!.priceCap(batchN)) as bigint;
      return { cap, last: (await getContract("BatchRegistry")!.getLastPrice(batchN)) as bigint };
    } catch { return null; }
  }, [batchN, markup]);
  const tx = useTx(onChanged);
  const over = !!priceWei && !!info.data && priceWei > info.data.cap;

  return (
    <Panel title="List a batch for sale">
      <div className="grid grid-cols-2 gap-3">
        <div><Label htmlFor="sale-batch">Batch #</Label><input id="sale-batch" className="field" inputMode="numeric" value={batch} onChange={(e) => setBatch(e.target.value)} /></div>
        <div><Label htmlFor="sale-price">Price (OLV)</Label><input id="sale-price" className="field" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
      </div>
      <p className={`mt-3 text-sm font-medium ${over ? "text-bad" : "text-muted"}`}>
        {info.data
          ? over
            ? `Above the cap: the escrow will reject it. Cap is ${olv(info.data.cap)} OLV.`
            : `Cap: ${olv(info.data.cap)} OLV (last price ${olv(info.data.last)} + ${markup} %).`
          : "Enter an existing batch to see its price cap."}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button className="btn" disabled={!priceWei || tx.pending} onClick={() => tx.run("Sale created", async () => (await write("PriceCapEscrow")).createSale(batchN, priceWei!))}>List for sale</button>
        <TxNote {...tx} />
      </div>
    </Panel>
  );
}

function SaleRow({ sale: s, m, account, onChanged }: { sale: Sale; m: Market; account: string | null; onChanged: () => void }) {
  const write = useWrite();
  const tx = useTx(onChanged);
  const isSeller = same(account, s.seller);
  const isBuyer = same(account, s.buyer);
  const custodyMoved = same(s.custodian, s.buyer);

  async function approveAndDeposit() {
    await tx.run("Deposited", async () => {
      const esc = await write("PriceCapEscrow");
      if (m.allowance < s.price) {
        const approval = await (await write("OliveCoin")).approve(m.escrowAddress, s.price);
        await approval.wait();
      }
      return esc.deposit(s.id);
    });
  }

  return (
    <li className="bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-xl font-bold">Sale #{s.id} · Batch #{s.batchId} · <span className="text-olive">{olv(s.price)} OLV</span></p>
        <span className={`px-3 py-1 text-sm font-semibold ${stateTone[s.state]}`}>{s.state}</span>
      </div>
      <p className="mt-1 text-sm text-muted">
        Seller {short(s.seller)}{isSeller ? " (you)" : ""}
        {s.state !== "Created" && s.state !== "Cancelled" && <> · buyer {short(s.buyer)}{isBuyer ? " (you)" : ""}</>}
      </p>
      {s.state === "Deposited" && (
        <p className="mt-1 text-sm">
          Certified: <b>{s.certified ? "yes" : "not yet"}</b> · Custody with buyer: <b>{custodyMoved ? "yes" : "not yet"}</b>
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {s.state === "Created" && <button className="btn" disabled={tx.pending} onClick={approveAndDeposit}>Deposit {olv(s.price)} OLV</button>}
        {s.state === "Created" && isSeller && <button className="btn btn-quiet" disabled={tx.pending} onClick={() => tx.run("Sale cancelled", async () => (await write("PriceCapEscrow")).cancelSale(s.id))}>Cancel sale</button>}
        {s.state === "Deposited" && <button className="btn" disabled={tx.pending} onClick={() => tx.run("Payment released", async () => (await write("PriceCapEscrow")).releasePayment(s.id))}>Release payment</button>}
        {s.state === "Deposited" && <button className="btn btn-quiet" disabled={tx.pending} onClick={() => tx.run("Refunded", async () => (await write("PriceCapEscrow")).refund(s.id))}>Refund</button>}
        <TxNote {...tx} />
      </div>
    </li>
  );
}
