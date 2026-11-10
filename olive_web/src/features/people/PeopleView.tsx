"use client";

import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { Callout, Chip } from "@/components/ui";
import { getContract } from "@/lib/contracts";
import { olv, same, short } from "@/lib/format";
import { useLoad } from "@/lib/hooks";
import { labelOf, loadAccounts, ROLE_KEYS } from "@/lib/roles";
import { useWallet } from "@/lib/wallet";
import { loadBatchRows } from "@/features/registry/data";

type Person = {
  address: string;
  index: number;
  label: string;
  olv: bigint;
  inspector: boolean;
  regulator: boolean;
  holds: number;
};

async function loadPeople(): Promise<Person[]> {
  const list = await loadAccounts();
  const coin = getContract("OliveCoin");
  const reg = getContract("BatchRegistry");
  const [balances, inspectors, batches, owner] = await Promise.all([
    Promise.all(list.map((a) => (coin ? coin.balanceOf(a) : 0n))),
    Promise.all(list.map((a) => (reg ? reg.isInspector(a) : false))),
    reg ? loadBatchRows() : Promise.resolve([]),
    reg ? reg.owner() : Promise.resolve(null),
  ]);
  return list.map((address, i) => ({
    address,
    index: i,
    label: labelOf(address, list),
    olv: balances[i] as bigint,
    inspector: !!inspectors[i],
    regulator: same(address, owner as string | null),
    holds: batches.filter((b) => same(b.custodian, address)).length,
  }));
}

export function PeopleView() {
  const { identity, actAs, connect, hasMetaMask } = useWallet();
  const people = useLoad(loadPeople, []);
  const list = people.data ?? [];
  const addresses = list.map((p) => p.address);

  return (
    <div className="mx-auto max-w-[1280px] px-5 pb-16 md:px-8">
      <header className="py-8">
        <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-none tracking-tighter text-deep">People</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Every account in this Ganache chain. Choose one to act as it while you test. The first six are the demo roles of the journey.
        </p>
      </header>

      <section aria-label="Who you are now" className="mb-8 bg-deep p-6 text-ground md:p-8">
        {identity?.kind === "demo" ? (
          <>
            <p className="text-sm font-bold text-ground/70">Acting now (demo user)</p>
            <p className="mt-1 text-3xl font-extrabold text-oil">{labelOf(identity.address, addresses)}</p>
            <p className="mt-2 break-all font-mono text-sm text-ground/80">{identity.address}</p>
            <p className="mt-3 max-w-2xl text-ground/85">
              Demo users sign through Ganache&rsquo;s unlocked accounts, so no MetaMask popup. This is for testing on a local chain only.
            </p>
          </>
        ) : identity?.kind === "metamask" ? (
          <>
            <p className="text-sm font-bold text-ground/70">Using MetaMask</p>
            <p className="mt-1 text-3xl font-extrabold">{labelOf(identity.address, addresses)}</p>
            <p className="mt-2 break-all font-mono text-sm text-ground/80">{identity.address}</p>
            <p className="mt-3 max-w-2xl text-ground/85">Pick a demo user below to act as it instead. MetaMask stays connected.</p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-ground/70">Nobody yet</p>
            <p className="mt-1 text-2xl font-extrabold">Choose a person below to act as.</p>
          </>
        )}
        {identity?.kind === "demo" && hasMetaMask && (
          <button type="button" className="btn btn-light mt-5" onClick={() => connect().catch(() => {})}>
            Connect MetaMask instead
          </button>
        )}
        {!identity && (
          <p className="mt-3 text-ground/80">
            Or <button type="button" className="font-bold underline underline-offset-4" onClick={() => connect().catch(() => {})}>connect MetaMask</button>.
          </p>
        )}
      </section>

      {people.loading && <p className="text-muted">Reading the accounts from Ganache…</p>}
      {people.error && <Callout tone="bad">{people.error}. Is Ganache running on 127.0.0.1:7545?</Callout>}

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => {
          const active = identity?.address && same(identity.address, p.address);
          return (
            <li key={p.address} className={`flex flex-col gap-4 p-6 ${active ? "bg-oil" : "bg-surface"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-extrabold">{p.label}</p>
                  {p.index < ROLE_KEYS.length ? (
                    <p className="text-sm font-semibold text-muted">Demo role {p.index + 1} of 6</p>
                  ) : (
                    <p className="text-sm font-semibold text-muted">Extra account, holds OLV for testing</p>
                  )}
                </div>
                {active && <Chip tone="dark">Acting now</Chip>}
              </div>
              <div className="flex flex-wrap gap-2">
                {p.regulator && <Chip tone="dark">Regulator and market authority</Chip>}
                {p.inspector && <Chip tone="ok">Inspector</Chip>}
                <Chip>{p.holds} batch{p.holds === 1 ? "" : "es"} held</Chip>
              </div>
              <dl className="grid gap-1 text-sm">
                <div className="flex justify-between gap-3"><dt className="font-bold text-muted">OLV balance</dt><dd className="font-extrabold">{olv(p.olv)} OLV</dd></div>
              </dl>
              <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
                <span className="break-all">{short(p.address)}</span>
                <CopyButton value={p.address} label="Copy address" />
              </div>
              <button
                type="button"
                className={`btn mt-auto ${active ? "btn-quiet" : ""}`}
                disabled={!!active}
                onClick={() => actAs(p.address, p.label)}
              >
                {active ? "You are acting as this" : `Act as ${p.label}`}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-10 text-muted">
        Want to see what each role does? <Link href="/journey" className="font-bold text-olive underline underline-offset-4">Open the guided demo</Link>.
      </p>
    </div>
  );
}
