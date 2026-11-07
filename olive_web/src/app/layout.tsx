import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OliveChain: olive oil chain of custody",
  description: "Trace olive oil batches as NFTs and pay for them in OLV through a price-cap escrow. Simulated assets on a local Ganache chain.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bricolage.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="mt-24 bg-deep text-ground">
            <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-8">
              <p className="text-[clamp(3rem,13vw,11rem)] font-extrabold leading-[0.9] tracking-tighter">OliveChain</p>
              <p className="mt-6 max-w-xl text-ground/80">All goods and payments are simulated on a local Ganache chain. No real olive oil, no real money.</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
