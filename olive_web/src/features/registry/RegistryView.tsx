"use client";

import { useState } from "react";
import { getContract } from "@/lib/contracts";
import { useLoad } from "@/lib/hooks";
import { useWallet } from "@/lib/wallet";
import { olv, short, same } from "@/lib/format";
import { loadBatches, loadRoles } from "./data";
import { RegulatorPanel } from "./RegulatorPanel";
import { MintForm } from "./MintForm";
import { BatchDetail } from "./BatchDetail";

export function RegistryView() {
  const { account } = useWallet();
  const deployed = !!getContract("BatchRegistry");
  const batches = useLoad(loadBatches, []);
  const roles = useLoad(() => (deployed ? loadRoles(account) : Promise.resolve(null)), [account, deployed]);
  const [selected, setSelected] = useState<number | null>(null);

  if (!deployed) {
    return <p className="mx-auto max-w-[1280px] px-5 py-12 md:px-8">BatchRegistry is not deployed yet. Run <code>npm run migrate</code> in <code>olive_blockchain</code>.</p>;
  }

  const afterMint = async () => {
    const total = Number(await getContract("BatchRegistry")!.totalBatches());
    await batches.reload();
    setSelected(total);
  };
  const r = roles.data;
  const list = batches.data ?? [];

  return (
    <div className="mx-auto max-w-[1280px] px-5 pb-8 md:px-8">
      <div className="flex flex-wrap items-baseline gap-4 py-8">
        <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-none tracking-tighter text-deep">Batches</h1>
        {r?.regulator && <span className="bg-olive px-3 py-1 text-sm font-semibold text-ground">regulator</span>}
        {r?.inspector && <span className="bg-oil px-3 py-1 text-sm font-semibold text-deep">inspector</span>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {r && <RegulatorPanel roles={r} onChanged={roles.reload} />}
        <MintForm onMinted={afterMint} />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section aria-label="All batches">
          <h2 className="mb-3 text-2xl font-bold tracking-tight">All batches</h2>
          {batches.error && <p role="alert" className="text-bad">{batches.error}</p>}
          {!batches.loading && list.length === 0 && <p className="bg-surface p-6 text-muted">No batches yet. Mint the first one.</p>}
          <ul className="grid gap-2">
            {list.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => setSelected(b.id)}
                  aria-pressed={selected === b.id}
                  className={`w-full p-4 text-left transition-colors ${selected === b.id ? "bg-deep text-ground" : "bg-surface hover:bg-surface-2"}`}
                >
                  <span className="flex items-baseline justify-between gap-4">
                    <span className="text-xl font-bold">Batch #{b.id}</span>
                    <span className={`font-bold ${selected === b.id ? "text-oil" : "text-olive"}`}>{olv(b.lastPrice)} OLV</span>
                  </span>
                  <span className="mt-1 block text-sm opacity-80">
                    {b.certified ? "Certified" : "Not certified"} · custodian {short(b.custodian)}{same(account, b.custodian) ? " (you)" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <div>
          {selected ? (
            <BatchDetail id={selected} isInspector={!!r?.inspector} onChanged={batches.reload} />
          ) : (
            <p className="bg-surface p-8 text-muted">Select a batch to see its custody, checkpoints and price history.</p>
          )}
        </div>
      </div>
    </div>
  );
}
