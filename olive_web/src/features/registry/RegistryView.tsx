"use client";

import { useState } from "react";
import Link from "next/link";
import { getContract } from "@/lib/contracts";
import { useLoad } from "@/lib/hooks";
import { useWallet } from "@/lib/wallet";
import { olv, same } from "@/lib/format";
import { labelOf, ROLE_NAME, roleOf, useAccounts, useRoleAddresses } from "@/lib/roles";
import { CLICKABLE, Chip, Panel, Segmented } from "@/components/ui";
import { loadBatchRows, loadRoles, type BatchRow } from "./data";
import { BatchDetail } from "./BatchDetail";
import { MintForm } from "./MintForm";
import { RegulatorPanel } from "./RegulatorPanel";

type Mode = "mine" | "all";

export function RegistryView() {
  const { account, onOliveChain } = useWallet();
  const accounts = useAccounts();
  const roles = useRoleAddresses();
  const rows = useLoad(loadBatchRows, []);
  const perms = useLoad(
    () =>
      getContract("BatchRegistry")
        ? loadRoles(account).then((r) => ({ inspector: r.inspector, regulator: r.regulator }))
        : Promise.resolve({ inspector: false, regulator: false }),
    [account],
  );
  const [pick, setPick] = useState<Mode | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (!getContract("BatchRegistry")) {
    return (
      <Shell>
        <p className="bg-surface p-6">Contracts are not deployed yet. Run <code>npm run migrate</code> in olive_blockchain, then refresh.</p>
      </Shell>
    );
  }

  const all: BatchRow[] = rows.data ?? [];
  const seeAll = !!perms.data && (perms.data.inspector || perms.data.regulator);
  const relevant = (r: BatchRow) => !account || seeAll || r.people.includes(account.toLowerCase());
  const mode: Mode = pick ?? (account && !seeAll ? "mine" : "all");
  const mineCount = all.filter(relevant).length;
  const list = mode === "all" ? all : all.filter(relevant);
  const selected = list.find((r) => r.id === selectedId) ?? list[0] ?? null;
  const who = account ? labelOf(account, accounts.data) : null;
  const myRole = roleOf(account, roles.data);

  const explain = !account
    ? "Connect MetaMask or act as a demo user to see the batches you are part of. 'All batches' is visible to everyone."
    : seeAll
      ? `You are ${who}. As ${myRole ? ROLE_NAME[myRole] : "an inspector or regulator"}, you can see every batch.`
      : `You are ${who}. 'My batches' lists the batches you minted, hold or received.`;

  return (
    <Shell>
      <header className="py-8">
        <p className="text-sm font-bold uppercase tracking-wide text-muted">Step 2 of the journey</p>
        <h1 className="mt-2 text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-none tracking-tighter text-deep">Batches</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">{explain}</p>
        <p className="mt-3 text-muted">
          New to this? <Link href="/journey" className="font-bold text-olive underline underline-offset-4">Follow the guided demo</Link>.
        </p>
      </header>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <Segmented<Mode>
          label="Which batches to show"
          value={mode}
          onChange={setPick}
          options={[
            { value: "mine", label: `My batches (${mineCount})` },
            { value: "all", label: `All batches (${all.length})` },
          ]}
        />
        {!onOliveChain && account && <Chip tone="warn">Switch to OliveChain to act</Chip>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section aria-label="Batch list" className="min-w-0">
          {rows.loading && <p className="bg-surface p-6 text-muted">Loading batches from Ganache…</p>}
          {rows.error && <p role="alert" className="bg-surface p-6 text-bad">{rows.error}</p>}
          {!rows.loading && list.length === 0 && (
            <div className="bg-surface p-6">
              <p className="text-lg font-bold">No batches to show here yet.</p>
              <p className="mt-2 text-muted">
                {mode === "mine" ? "Nothing has been minted to you or passed to you. " : ""}
                Create one as the farmer below, or follow the guided demo.
              </p>
            </div>
          )}
          <ul className="grid gap-3">
            {list.map((r) => {
              const isSel = selected?.id === r.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    aria-pressed={isSel}
                    className={`${CLICKABLE} ${isSel ? "bg-deep text-ground" : "bg-surface hover:bg-surface-2"}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-3">
                        <span className="text-xl font-extrabold">Batch #{r.id}</span>
                        <span className={`font-extrabold ${isSel ? "text-oil" : "text-olive"}`}>{olv(r.lastPrice)} OLV</span>
                      </span>
                      <span className="mt-2 flex flex-wrap gap-2">
                        {r.certified ? <Chip tone="ok">Certified</Chip> : <Chip>Not certified</Chip>}
                        <Chip>With {labelOf(r.custodian, accounts.data)}</Chip>
                        {same(account, r.custodian) && <Chip tone="warn">Held by you</Chip>}
                      </span>
                    </span>
                    <span aria-hidden className={`shrink-0 font-extrabold underline underline-offset-4 ${isSel ? "text-oil" : "text-olive"}`}>
                      {isSel ? "Viewing" : "Open"} →
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="grid min-w-0 content-start gap-6">
          {selected ? (
            <BatchDetail
              key={selected.id}
              row={selected}
              account={account}
              accounts={accounts.data}
              perms={perms.data ?? null}
              onChanged={rows.reload}
            />
          ) : (
            <Panel title="Batch details">
              <p className="text-muted">Pick a batch on the left to see who holds it, its checkpoints and its price history.</p>
            </Panel>
          )}
        </div>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <details className="group bg-surface">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 p-5 text-lg font-extrabold [&::-webkit-details-marker]:hidden">
            Create a new batch <span aria-hidden className="text-2xl text-olive transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="px-5 pb-6">
            <MintForm account={account} roleKey={myRole} accounts={accounts.data} onMinted={async () => { setSelectedId(null); await rows.reload(); }} />
          </div>
        </details>
        <details className="group bg-surface">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 p-5 text-lg font-extrabold [&::-webkit-details-marker]:hidden">
            Regulator tools <span aria-hidden className="text-2xl text-olive transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="px-5 pb-6">
            <RegulatorPanel allowed={!!perms.data?.regulator} account={account} accounts={accounts.data} />
          </div>
        </details>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-[1280px] px-5 pb-16 md:px-8">{children}</div>;
}
