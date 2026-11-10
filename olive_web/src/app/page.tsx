import Link from "next/link";
import { OliveArt } from "@/components/OliveArt";
import { StatusPanel } from "@/components/StatusPanel";

const chain = [
  { who: "Farmer", what: "Harvests the olives and mints the lot as an NFT with a declared price." },
  { who: "Mill operator", what: "Cold-presses the olives. An inspector records acidity and polyphenols." },
  { who: "Distributor", what: "Bottles the certified oil and lists it. The escrow refuses a price over the cap." },
  { who: "Grocery", what: "Deposits OLV. Once the batch arrives, the distributor is paid and the price is recorded." },
];

export default function Home() {
  return (
    <>
      <section className="bg-deep text-ground">
        <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-5 py-16 md:px-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:py-24">
          <div>
            <h1 className="rise text-[clamp(2.25rem,6.2vw,5.75rem)] font-extrabold leading-[0.95] tracking-tighter">Every bottle traced. Every price capped.</h1>
            <p className="rise mt-8 max-w-xl text-xl text-ground/85" style={{ ["--i" as string]: 1 }}>
              OliveChain follows a lot of olive oil from the grove to the shelf as an NFT, and pays for it in OLV through an escrow that refuses unfair markups.
            </p>
            <div className="rise mt-8 flex flex-wrap gap-3" style={{ ["--i" as string]: 2 }}>
              <Link href="/journey" className="btn btn-light">Start the guided demo</Link>
              <Link href="/guide" className="btn btn-quiet">Read the guide</Link>
            </div>
            <p className="rise mt-4 text-ground/70" style={{ ["--i" as string]: 3 }}>Eight steps, about ten minutes. Every step names the MetaMask account to use.</p>
          </div>
          <OliveArt className="rise w-full" />
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1280px] px-5 md:px-8">
        <h2 className="max-w-3xl text-[clamp(2rem,4.5vw,3.5rem)] font-extrabold leading-none tracking-tighter text-deep">One lot, four hands, no surprises.</h2>
        <ol className="mt-10 grid gap-3 md:grid-cols-4">
          {chain.map((c, i) => (
            <li key={c.who} className={`p-6 ${["bg-surface", "bg-surface-2", "bg-surface", "bg-surface-2"][i]}`}>
              <p className="text-2xl font-bold tracking-tight">{c.who}</p>
              <p className="mt-3 text-muted">{c.what}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-24 grid max-w-[1280px] gap-3 px-5 md:grid-cols-2 md:px-8">
        <div className="bg-olive p-8 text-ground md:p-12">
          <h2 className="text-4xl font-extrabold tracking-tighter">The NFT is the oil.</h2>
          <p className="mt-4 text-lg text-ground/90">Each batch is an ERC-721 token. Holding it means holding the lot. Custody, quality checkpoints, certification and every price live on the chain and can be audited by anyone.</p>
        </div>
        <div className="bg-oil p-8 text-deep md:p-12">
          <h2 className="text-4xl font-extrabold tracking-tighter">The coin is the deal.</h2>
          <p className="mt-4 text-lg">OLV is an ERC-20 token. The escrow locks it until the oil is certified and delivered, and no seller can ask more than the last price plus the allowed markup.</p>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1280px] px-5 md:px-8">
        <StatusPanel />
      </section>
    </>
  );
}
