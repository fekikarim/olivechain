"use client";

import { getReadProvider } from "./contracts";
import { useLoad } from "./hooks";
import { short } from "./format";

export const ROLE_KEYS = ["regulator", "inspector", "farmer", "mill", "distributor", "grocery"] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];
export type RoleAddresses = Record<RoleKey, string>;

export const ROLE_NAME: Record<RoleKey, string> = {
  regulator: "Regulator",
  inspector: "Inspector",
  farmer: "Farmer",
  mill: "Mill operator",
  distributor: "Distributor",
  grocery: "Grocery",
};

let cache: Promise<string[]> | null = null;

/** Every Ganache account, in order. Index 0-5 are the named roles (see olive_blockchain/migrations). */
export function loadAccounts(): Promise<string[]> {
  cache ??= getReadProvider()
    .send("eth_accounts", [])
    .catch((e) => {
      cache = null;
      throw e;
    });
  return cache;
}

export function useAccounts() {
  return useLoad(loadAccounts, []);
}

export async function loadRoleAddresses(): Promise<RoleAddresses> {
  const list = await loadAccounts();
  if (list.length < ROLE_KEYS.length) throw new Error(`Ganache must run at least ${ROLE_KEYS.length} accounts`);
  return Object.fromEntries(ROLE_KEYS.map((k, i) => [k, list[i]])) as RoleAddresses;
}

export function useRoleAddresses() {
  return useLoad(loadRoleAddresses, []);
}

export function roleOf(account: string | null | undefined, roles: RoleAddresses | null | undefined): RoleKey | null {
  if (!account || !roles) return null;
  return ROLE_KEYS.find((k) => roles[k].toLowerCase() === account.toLowerCase()) ?? null;
}

/** Human label for an address: role name for the six demo roles, "Spare account N" for the rest. */
export function labelOf(address: string | null | undefined, accounts: string[] | null | undefined): string {
  if (!address) return "Nobody";
  const i = accounts?.findIndex((a) => a.toLowerCase() === address.toLowerCase()) ?? -1;
  if (i >= 0 && i < ROLE_KEYS.length) return ROLE_NAME[ROLE_KEYS[i]];
  if (i >= 0) return `Spare account ${i + 1}`;
  return short(address);
}

/** The demo role for an address by its position in the account list, or null for any other account. */
export function roleKeyFor(address: string | null | undefined, accounts: string[] | null | undefined): RoleKey | null {
  if (!address || !accounts) return null;
  const i = accounts.findIndex((a) => a.toLowerCase() === address.toLowerCase());
  return i >= 0 && i < ROLE_KEYS.length ? ROLE_KEYS[i] : null;
}
