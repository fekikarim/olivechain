"use client";

import { useState } from "react";
import Link from "next/link";
import { Gate, Label } from "@/components/ui";
import { TxNote } from "@/components/TxNote";
import { OlvCoin } from "@/components/Icons";
import { toOlv } from "@/lib/format";
import { useSend, useTx } from "@/lib/hooks";
import { ROLE_NAME, type RoleKey } from "@/lib/roles";

export function MintForm({
  account, roleKey, accounts: _accounts, onMinted,
}: { account: string | null; roleKey: RoleKey | null; accounts?: string[] | null; onMinted: () => void | Promise<void> }) {
  const send = useSend();
  const tx = useTx(onMinted);
  const [uri, setUri] = useState("ipfs://olivechain/chemlali-500kg");
  const [price, setPrice] = useState("200");
  const p = toOlv(price);
  const isFarmer = roleKey === "farmer";
  const reason = !account
    ? "Connect MetaMask or act as the Farmer to mint a batch."
    : <>Only the farmer creates batches. You are not the farmer. <Link href="/people" className="font-bold underline underline-offset-4">Act as the Farmer</Link> on the People page.</>;

  return (
    <Gate allowed={!!account && isFarmer} reason={reason}>
      <p className="text-muted">The farmer registers an olive lot. It becomes one NFT, and the farmer holds it first.</p>
      <div className="grid min-w-0 gap-5">
        <div className="grid min-w-0 gap-1.5">
          <Label htmlFor="mint-price">Declared price (OLV)</Label>
          <div className="relative max-w-xs">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center"><OlvCoin size={24} /></span>
            <input id="mint-price" className="field" style={{ paddingLeft: "3.25rem" }} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>
        <div className="grid min-w-0 gap-1.5">
          <Label htmlFor="mint-uri">Batch description (variety, farm, harvest, litres)</Label>
          <input id="mint-uri" className="field w-full min-w-0" value={uri} onChange={(e) => setUri(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="btn"
          disabled={!p || !uri.trim() || tx.pending}
          onClick={() => tx.run("Batch minted", () => send("BatchRegistry", "mintBatch", [account, uri.trim(), p!]))}
        >
          Mint the batch
        </button>
        <TxNote {...tx} />
      </div>
      <p className="text-sm text-muted">As {ROLE_NAME.farmer.toLowerCase()} you hold the new batch first.</p>
    </Gate>
  );
}
