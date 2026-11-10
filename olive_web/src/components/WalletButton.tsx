"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/lib/wallet";
import { errorMessage, short } from "@/lib/format";
import { labelOf, useAccounts } from "@/lib/roles";

export function WalletButton() {
  const w = useWallet();
  const accounts = useAccounts();
  const [err, setErr] = useState<string | null>(null);
  const act = (fn: () => Promise<void>) => fn().then(() => setErr(null)).catch((e) => setErr(errorMessage(e)));
  const who = w.account ? labelOf(w.account, accounts.data) : null;
  const initials = who ? who.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() : "";
  const small = "btn btn-sm";

  return (
    <div className="flex items-center gap-2">
      {w.identity ? (
        <div className="flex items-center gap-2" title={w.identity.address}>
          <span aria-hidden className="grid h-8 w-8 place-items-center bg-deep text-sm font-extrabold text-oil">{initials}</span>
          <p className="whitespace-nowrap font-extrabold leading-tight">
            {who}
            <span className="ml-1 text-xs font-bold uppercase text-muted">{w.identity.kind === "demo" ? "demo" : "metamask"}</span>
          </p>
        </div>
      ) : (
        <p className="whitespace-nowrap font-semibold text-muted">Not signed in</p>
      )}

      {w.identity?.kind === "demo" && (
        <button type="button" className={small} onClick={() => act(w.connect)}>Use MetaMask</button>
      )}
      {w.identity?.kind === "demo" && (
        <button type="button" className={`${small} btn-ghost`} onClick={w.stopActingAs}>Stop</button>
      )}
      {w.identity?.kind === "metamask" && !w.onOliveChain && (
        <button type="button" className={small} onClick={() => act(w.switchToOliveChain)}>Switch network</button>
      )}
      {!w.identity && w.hasMetaMask && (
        <button type="button" className={small} onClick={() => act(w.connect)}>Connect MetaMask</button>
      )}
      {!w.identity && !w.hasMetaMask && (
        <a className={small} href="https://metamask.io/download/" target="_blank" rel="noopener">Install MetaMask</a>
      )}
      {(!w.identity || w.identity.kind === "metamask") && (
        <Link href="/people" className={`${small} btn-ghost`}>Demo user</Link>
      )}
      {err && <p role="alert" className="absolute right-5 top-full mt-1 max-w-72 bg-bad px-3 py-2 text-sm font-semibold text-ground md:right-8">{err}</p>}
    </div>
  );
}
