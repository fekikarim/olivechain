import type { ReactNode } from "react";
import type { RoleKey } from "@/lib/roles";

type IconProps = { className?: string; size?: number };

/** Stroke icon base: 24px grid, rounded joins, inherits colour from the parent. */
function Svg({ children, className, size = 20 }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

/** Batch registered: a seedling. */
export const IconSprout = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21v-9" />
    <path d="M12 12C12 8 9 5 4 5c0 4 3 7 8 7" />
    <path d="M12 14c0-3 3-6 8-6 0 4-3 6-8 6" />
  </Svg>
);

/** Custody passed on: two opposing arrows. */
export const IconTransfer = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8h13" />
    <path d="m14 4 4 4-4 4" />
    <path d="M20 16H7" />
    <path d="m10 12-4 4 4 4" />
  </Svg>
);

/** Quality checkpoint: a lab flask. */
export const IconFlask = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 3h6" />
    <path d="M10 3v6L4.9 17.4A2 2 0 0 0 6.6 20h10.8a2 2 0 0 0 1.7-2.6L14 9V3" />
    <path d="M7.5 15h9" />
  </Svg>
);

/** Certified: a badge with a tick. */
export const IconBadge = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 14.4 4.8l3-.1.9 2.9 2.5 1.7-1.2 2.8 1.2 2.8-2.5 1.7-.9 2.9-3-.1L12 21l-2.4-1.8-3 .1-.9-2.9-2.5-1.7 1.2-2.8-1.2-2.8 2.5-1.7.9-2.9 3 .1z" />
    <path d="m8.8 12.2 2.2 2.2 4.2-4.4" />
  </Svg>
);

/** Price recorded: a price tag. */
export const IconTag = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12V4h8l10 10-8 8z" />
    <circle cx="7.5" cy="8.5" r="1.2" />
  </Svg>
);

/** Sale listed / generic market: a storefront awning. */
export const IconStore = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 10v10h16V10" />
    <path d="M3 4h18l1 6H2z" />
    <path d="M9 20v-5h6v5" />
  </Svg>
);

/**
 * OLV token mark: a gold coin with an olive leaf.
 * Used wherever an OLV amount appears so the currency is recognisable at a glance.
 */
export function OlvCoin({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full bg-oil text-deep ring-2 ring-deep/80 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="currentColor" focusable="false">
        <path d="M4.5 19.5C4.5 10.5 9.5 5 19.5 4.5c.4 9.5-4.8 15-15 15z" />
        <path d="M4.5 19.5 13 11" stroke="var(--oil)" strokeWidth={1.6} strokeLinecap="round" fill="none" />
      </svg>
    </span>
  );
}

/** An OLV amount with its coin, e.g. [coin] 200 OLV. */
export function OlvAmount({ value, size = 28, className = "" }: { value: string; size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap ${className}`}>
      <OlvCoin size={size} />
      <span>{value} OLV</span>
    </span>
  );
}

/** Regulator: a shield with a tick. */
export const IconShield = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </Svg>
);

/** Inspector: a magnifying glass over a leaf. */
export const IconInspect = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
    <path d="M7.5 10.5c1.2-1.4 2.6-1.9 4.2-1.6-.3 1.6-1.2 3-2.7 3.9" />
  </Svg>
);

/** Farmer: an olive tree. */
export const IconOliveTree = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="5" />
    <path d="M12 13v8" />
    <path d="M8 21h8" />
  </Svg>
);

/** Mill operator: a factory with a chimney. */
export const IconFactory = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 21V10l5 3V10l5 3V6h8v15z" />
    <path d="M3 21h18" />
    <path d="M18 3v3" />
  </Svg>
);

/** Distributor: a delivery truck. */
export const IconTruck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 6h12v10H2z" />
    <path d="M14 10h4l3 3v3h-7" />
    <circle cx="6" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
  </Svg>
);

/** Grocery: a shopping bag. */
export const IconBag = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 8h14l-1 12H6z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </Svg>
);

/** Any account that is not one of the six demo roles. */
export const IconUser = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
  </Svg>
);

const ROLE_ICON: Record<RoleKey, (p: IconProps) => ReactNode> = {
  regulator: IconShield,
  inspector: IconInspect,
  farmer: IconOliveTree,
  mill: IconFactory,
  distributor: IconTruck,
  grocery: IconBag,
};

/** Square avatar tile with the icon for a demo role, or the generic user icon for any other account. */
export function RoleAvatar({ role, size = 40, className = "" }: { role: RoleKey | null; size?: number; className?: string }) {
  const Icon = role ? ROLE_ICON[role] : IconUser;
  return (
    <span
      className={`grid shrink-0 place-items-center bg-deep text-oil ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Icon size={Math.round(size * 0.55)} />
    </span>
  );
}
