"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "./WalletButton";
import { DemoStatus } from "./DemoStatus";

const links = [
  { href: "/journey", label: "Demo" },
  { href: "/registry", label: "Batches" },
  { href: "/market", label: "Market" },
  { href: "/people", label: "People" },
  { href: "/guide", label: "Guide" },
];

export function Header() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b-2 border-surface-2 bg-ground">
      <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-5 py-2 md:px-8">
        <Link href="/" className="shrink-0 text-xl font-extrabold tracking-tight text-deep">OliveChain</Link>
        <nav aria-label="Main" className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {links.map((l) => {
            const active = path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-10 shrink-0 items-center px-3 font-bold transition-colors ${
                  active ? "bg-deep text-ground" : "text-deep hover:bg-surface"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0">
          <WalletButton />
        </div>
      </div>
      <DemoStatus />
    </header>
  );
}
