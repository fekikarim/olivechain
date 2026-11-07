"use client";

import { useState } from "react";
import { Panel, Label } from "@/components/Section";
import { TxNote } from "@/components/TxNote";
import { useTx, useWrite } from "@/lib/hooks";
import { useWallet } from "@/lib/wallet";
import { toOlv } from "@/lib/format";

export function MintForm({ onMinted }: { onMinted: () => void | Promise<void> }) {
  const { account } = useWallet();
  const write = useWrite();
  const [to, setTo] = useState("");
  const [uri, setUri] = useState("ipfs://olivechain/chemlali-lot-01");
  const [price, setPrice] = useState("200");
  const tx = useTx(onMinted);
  const receiver = to || account || "";
  const priceWei = toOlv(price);

  return (
    <Panel title="Mint a batch">
      <p className="mb-4 text-muted">The farmer registers an olive lot. It becomes one NFT, held by the first custodian.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="mint-to">First custodian</Label>
          <input id="mint-to" className="field" placeholder={account ?? "0x… (connect MetaMask)"} value={to} onChange={(e) => setTo(e.target.value.trim())} />
        </div>
        <div>
          <Label htmlFor="mint-price">Declared price (OLV)</Label>
          <input id="mint-price" className="field" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="mint-uri">Metadata URI (variety, farm, harvest, litres)</Label>
          <input id="mint-uri" className="field" value={uri} onChange={(e) => setUri(e.target.value)} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button className="btn" disabled={!priceWei || !uri || tx.pending} onClick={() => tx.run("Batch minted", async () => (await write("BatchRegistry")).mintBatch(receiver, uri, priceWei!))}>Mint batch</button>
        <TxNote {...tx} />
      </div>
    </Panel>
  );
}
