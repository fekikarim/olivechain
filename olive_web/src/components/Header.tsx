"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "./WalletButton";

const links = [
  { href: "/registry", label: "Registry" },
  { href: "/market", label: "Market" },
  { href: "/guide", label: "Guide" },
];

export function Header() {
  const path = usePathname();
  return (
    <header className="bg-ground">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4 md:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-extrabold tracking-tight text-deep">OliveChain</Link>
          <nav aria-label="Main" className="flex gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={path.startsWith(l.href) ? "page" : undefined}
                className={`px-3 py-2 font-semibold transition-colors hover:text-olive ${path.startsWith(l.href) ? "bg-surface text-deep" : "text-muted"}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <WalletButton />
      </div>
    </header>
  );
}
