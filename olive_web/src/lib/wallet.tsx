"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BrowserProvider, type JsonRpcSigner } from "ethers";
import { CHAIN } from "./chain";
import { getReadProvider } from "./contracts";

/** Who the app acts as: a demo user (Ganache account, testing only) or the connected MetaMask account. */
export type Identity = { kind: "demo" | "metamask"; address: string };
type Demo = { address: string; label: string };

type Wallet = {
  hasMetaMask: boolean;
  identity: Identity | null;
  account: string | null;
  chainId: number | null;
  onOliveChain: boolean;
  connect: () => Promise<void>;
  switchToOliveChain: () => Promise<void>;
  actAs: (address: string, label: string) => void;
  stopActingAs: () => void;
  getSigner: () => Promise<JsonRpcSigner>;
};

const Ctx = createContext<Wallet | null>(null);
const KEY = "olivechain.demo-identity";

export function useWallet(): Wallet {
  const w = useContext(Ctx);
  if (!w) throw new Error("useWallet must be used inside WalletProvider");
  return w;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [mmAccount, setMmAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [demo, setDemo] = useState<Demo | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setDemo(JSON.parse(raw) as Demo);
    } catch {
      /* storage blocked: start without a demo user */
    }
  }, []);

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;
    setHasMetaMask(true);
    const onAccounts = (a: unknown) => setMmAccount((a as string[])[0] ?? null);
    const onChain = (id: unknown) => setChainId(Number(id as string));
    eth.request({ method: "eth_accounts" }).then(onAccounts).catch(() => {});
    eth.request({ method: "eth_chainId" }).then(onChain).catch(() => {});
    eth.on?.("accountsChanged", onAccounts);
    eth.on?.("chainChanged", onChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const actAs = useCallback((address: string, label: string) => {
    const d: Demo = { address, label };
    setDemo(d);
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* ignore */ }
  }, []);

  const stopActingAs = useCallback(() => {
    setDemo(null);
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  }, []);

  /** Connecting MetaMask replaces any demo user. */
  const connect = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) throw new Error("MetaMask is not installed");
    stopActingAs();
    const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
    setMmAccount(accounts[0] ?? null);
    setChainId(Number((await eth.request({ method: "eth_chainId" })) as string));
  }, [stopActingAs]);

  const switchToOliveChain = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) throw new Error("MetaMask is not installed");
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN.idHex }] });
    } catch (e) {
      if ((e as { code?: number }).code !== 4902) throw e;
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: CHAIN.idHex,
          chainName: CHAIN.name,
          rpcUrls: [CHAIN.rpcUrl],
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        }],
      });
    }
  }, []);

  /** Demo users sign through Ganache's unlocked accounts; MetaMask signs otherwise. */
  const getSigner = useCallback(async () => {
    if (demo) return getReadProvider().getSigner(demo.address);
    if (!window.ethereum) throw new Error("MetaMask is not installed");
    return new BrowserProvider(window.ethereum).getSigner();
  }, [demo]);

  const identity: Identity | null = demo
    ? { kind: "demo", address: demo.address }
    : mmAccount ? { kind: "metamask", address: mmAccount } : null;

  const value = useMemo<Wallet>(
    () => ({
      hasMetaMask,
      identity,
      account: identity?.address ?? null,
      chainId,
      onOliveChain: demo ? true : chainId === CHAIN.id,
      connect,
      switchToOliveChain,
      actAs,
      stopActingAs,
      getSigner,
    }),
    // identity is derived from demo and mmAccount; those are the real inputs
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasMetaMask, demo, mmAccount, chainId, connect, switchToOliveChain, actAs, stopActingAs, getSigner],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
