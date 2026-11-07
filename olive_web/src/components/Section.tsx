import type { ReactNode } from "react";

/** A tone-stepped surface with a heading. No borders, no shadows. */
export function Panel({ title, children, tone = "surface", className = "" }: { title: string; children: ReactNode; tone?: "surface" | "deep"; className?: string }) {
  const dark = tone === "deep";
  return (
    <section className={`p-6 md:p-8 ${dark ? "bg-deep text-ground" : "bg-surface"} ${className}`}>
      <h2 className="mb-4 text-2xl font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return <label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold text-muted">{children}</label>;
}
