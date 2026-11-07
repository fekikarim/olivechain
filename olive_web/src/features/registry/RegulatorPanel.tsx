"use client";

import { useState } from "react";
import { isAddress } from "ethers";
import { Panel, Label } from "@/components/Section";
import { TxNote } from "@/components/TxNote";
import { useTx, useWrite, useLoad } from "@/lib/hooks";
import { getContract } from "@/lib/contracts";
import { ZERO, same, short } from "@/lib/format";
import type { Roles } from "./data";

export function RegulatorPanel({ roles, onChanged }: { roles: Roles & { owner: string }; onChanged: () => void }) {
  const write = useWrite();
  const [inspector, setInspector] = useState("");
  const [escrow, setEscrow] = useState("");
  const valid = isAddress(inspector);
  const current = useLoad(async () => (valid ? ((await getContract("BatchRegistry")!.isInspector(inspector)) as boolean) : null), [inspector, valid]);
  const tx = useTx(async () => { await current.reload(); onChanged(); });

  return (
    <Panel title="Regulator">
      {!roles.regulator && (
        <p className="mb-4 bg-surface-2 p-3 text-sm font-medium">You are not the regulator ({short(roles.owner)}): the contract will reject these actions.</p>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="insp">Inspector address</Label>
          <input id="insp" className="field" placeholder="0x…" value={inspector} onChange={(e) => setInspector(e.target.value.trim())} />
          {valid && current.data !== null && <p className="mt-1 text-sm text-muted">Currently: {current.data ? "inspector ✓" : "not an inspector"}</p>}
          <div className="mt-3 flex gap-2">
            <button className="btn" disabled={!valid || tx.pending} onClick={() => tx.run("Inspector granted", async () => (await write("BatchRegistry")).setInspector(inspector, true))}>Grant</button>
            <button className="btn btn-quiet" disabled={!valid || tx.pending} onClick={() => tx.run("Inspector revoked", async () => (await write("BatchRegistry")).setInspector(inspector, false))}>Revoke</button>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-muted">Escrow</p>
          <p className="mb-3 break-all">{same(roles.escrow, ZERO) ? "None set" : roles.escrow}</p>
          <Label htmlFor="esc">New escrow address</Label>
          <input id="esc" className="field" placeholder="0x…" value={escrow} onChange={(e) => setEscrow(e.target.value.trim())} />
          <button className="btn mt-3" disabled={!escrow || tx.pending} onClick={() => tx.run("Escrow set", async () => (await write("BatchRegistry")).setEscrow(escrow))}>Set escrow</button>
        </div>
      </div>
      <div className="mt-4"><TxNote {...tx} /></div>
    </Panel>
  );
}
