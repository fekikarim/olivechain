import type { ReactNode } from "react";

/** Every list item that opens something: hover lift, pointer, plain-language arrow. Add the background yourself. */
export const CLICKABLE = "group flex w-full items-center gap-4 p-4 text-left cursor-pointer transition duration-150 hover:-translate-y-0.5 active:translate-y-0";

const TONE = {
  neutral: "bg-surface-2 text-deep",
  ok: "bg-olive text-ground",
  warn: "bg-oil text-deep",
  bad: "bg-bad text-ground",
  dark: "bg-deep text-ground",
} as const;

export function Chip({ tone = "neutral", children }: { tone?: keyof typeof TONE; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-sm font-semibold ${TONE[tone]}`}>{children}</span>;
}

export function Callout({ tone = "warn", children }: { tone?: "warn" | "info" | "bad" | "ok"; children: ReactNode }) {
  const cls = {
    warn: "bg-oil text-deep",
    info: "bg-surface-2 text-ink",
    bad: "bg-bad text-ground",
    ok: "bg-olive text-ground",
  }[tone];
  return <div role="status" className={`p-4 font-medium ${cls}`}>{children}</div>;
}

/** Disables everything inside when the user is not allowed to act, and says why. */
export function Gate({ allowed, reason, children }: { allowed: boolean; reason?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-4">
      {!allowed && reason && <Callout>{reason}</Callout>}
      <fieldset disabled={!allowed} className="grid min-w-0 gap-4 border-0 p-0">
        {children}
      </fieldset>
    </div>
  );
}

export function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="bg-surface p-6 md:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Two-option switch. Pressed state is shown with a filled button, not colour alone. */
export function Segmented<T extends string>({
  label, value, options, onChange,
}: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-11 px-4 font-bold transition-colors ${value === o.value ? "bg-deep text-ground" : "bg-surface-2 text-deep hover:bg-surface"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return <label htmlFor={htmlFor} className="mb-1 block text-sm font-bold text-ink">{children}</label>;
}
