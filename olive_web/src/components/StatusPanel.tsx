"use client";

import { API_URL, CHAIN } from "@/lib/chain";
import { contractNames, getDeployment, getReadProvider } from "@/lib/contracts";
import { useLoad } from "@/lib/hooks";
import { useWallet } from "@/lib/wallet";
import { short } from "@/lib/format";
import { Panel } from "./Section";

function Row({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <li className="flex items-baseline gap-3 py-1.5">
      <span aria-hidden className={`mt-1 inline-block h-3 w-3 shrink-0 rounded-full ${ok ? "bg-olive" : "bg-bad"}`} />
      <span className="font-semibold">{label}</span>
      <span className="break-all text-muted">{ok ? "ok" : "not ready"}{detail ? ` · ${detail}` : ""}</span>
    </li>
  );
}

export function StatusPanel() {
  const w = useWallet();
  const block = useLoad(() => getReadProvider().getBlockNumber(), []);
  const api = useLoad(async () => {
    try { return (await fetch(`${API_URL}/api/health`)).ok; } catch { return false; }
  }, []);

  return (
    <Panel title="Connection status">
      <ul>
        <Row ok={block.data !== null} label="Ganache RPC" detail={block.data !== null ? `${CHAIN.rpcUrl}, block ${block.data}` : CHAIN.rpcUrl} />
        <Row ok={w.hasMetaMask} label="MetaMask installed" />
        <Row ok={!!w.account} label="Wallet connected" detail={w.account ? short(w.account) : undefined} />
        <Row ok={w.onOliveChain} label={`Network chain ID ${CHAIN.id}`} detail={w.chainId ? `wallet on ${w.chainId}` : undefined} />
        {contractNames.map((n) => {
          const d = getDeployment(n);
          return <Row key={n} ok={!!d} label={`${n} deployed`} detail={d?.address} />;
        })}
        <Row ok={api.data === true} label="Backend API" detail={API_URL} />
      </ul>
    </Panel>
  );
}
