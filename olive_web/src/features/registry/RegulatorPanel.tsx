"use client";

import { useState } from "react";
import Link from "next/link";
import { Gate, Label } from "@/components/ui";
import { TxNote } from "@/components/TxNote";
import { getContract } from "@/lib/contracts";
import { useLoad, useSend, useTx } from "@/lib/hooks";
import { labelOf } from "@/lib/roles";

export function RegulatorPanel({ allowed, account, accounts }: { allowed: boolean; account: string | null; accounts: string[] | null | undefined }) {
  const send = useSend();
  const [who, setWho] = useState("");
  const status = useLoad(
    async () => (who && getContract("BatchRegistry") ? ((await getContract("BatchRegistry")!.isInspector(who)) as boolean) : null),
    [who],
  );
  const tx = useTx(async () => { await status.reload(); });
  const reason = !account
    ? "Connect MetaMask or act as the Regulator to manage inspectors."
    : <>Only the regulator manages inspectors. <Link href="/people" className="font-bold underline underline-offset-4">Act as the Regulator</Link> on the People page.</>;

  return (
    <Gate allowed={allowed} reason={reason}>
      <p className="text-muted">Inspectors record quality checkpoints and certify batches. Choose an account to grant or revoke the role.</p>
      <div>
        <Label htmlFor="insp-pick">Account</Label>
        <select id="insp-pick" className="field" value={who} onChange={(e) => setWho(e.target.value)}>
          <option value="">Choose an account…</option>
          {(accounts ?? []).map((a) => <option key={a} value={a}>{labelOf(a, accounts)}</option>)}
        </select>
        {who && status.data !== null && (
          <p className="mt-2 font-semibold">{labelOf(who, accounts)} is {status.data ? "an inspector" : "not an inspector"}.</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn" disabled={!who || tx.pending} onClick={() => tx.run("Inspector granted", () => send("BatchRegistry", "setInspector", [who, true]))}>Grant inspector role</button>
        <button type="button" className="btn btn-ghost" disabled={!who || tx.pending} onClick={() => tx.run("Inspector revoked", () => send("BatchRegistry", "setInspector", [who, false]))}>Revoke role</button>
      </div>
      <TxNote {...tx} />
    </Gate>
  );
}
