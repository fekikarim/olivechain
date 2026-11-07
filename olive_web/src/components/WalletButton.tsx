"use client";

import { useState } from "react";
import { useWallet } from "@/lib/wallet";
import { errorMessage, short } from "@/lib/format";

export function WalletButton() {
  const w = useWallet();
  const [err, setErr] = useState<string | null>(null);
  const act = (fn: () => Promise<void>) => fn().then(() => setErr(null)).catch((e) => setErr(errorMessage(e)));

  let label = "Connect MetaMask";
  let onClick: () => unknown = () => act(w.connect);
  if (!w.hasMetaMask) {
    label = "Install MetaMask";
    onClick = () => { window.open("https://metamask.io/download/", "_blank", "noopener"); };
  } else if (w.account && !w.onOliveChain) {
    label = "Switch to OliveChain (Ganache)";
    onClick = () => act(w.switchToOliveChain);
  } else if (w.account) {
    label = short(w.account);
  }
  const connected = w.account && w.onOliveChain;

  return (
    <div className="flex flex-col items-end">
      <button type="button" className={`btn ${connected ? "btn-quiet" : ""}`} onClick={onClick} disabled={!!connected}>
        {connected && <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-olive" />}
        {label}
      </button>
      {err && <p role="alert" className="mt-1 max-w-64 text-right text-sm text-bad">{err}</p>}
    </div>
  );
}
