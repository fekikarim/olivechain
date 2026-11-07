"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BrowserProvider, type JsonRpcSigner } from "ethers";
import { CHAIN } from "./chain";

type Wallet = {
  hasMetaMask: boolean;
  account: string | null;
  chainId: number | null;
  onOliveChain: boolean;
  connect: () => Promise<void>;
  switchToOliveChain: () => Promise<void>;
  getSigner: () => Promise<JsonRpcSigner>;
};

const Ctx = createContext<Wallet | null>(null);

export function useWallet(): Wallet {
  const w = useContext(Ctx);
  if (!w) throw new Error("useWallet must be used inside WalletProvider");
  return w;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;
    setHasMetaMask(true);
    const onAccounts = (a: unknown) => setAccount((a as string[])[0] ?? null);
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

  const connect = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) throw new Error("MetaMask is not installed");
    const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
    setAccount(accounts[0] ?? null);
    setChainId(Number((await eth.request({ method: "eth_chainId" })) as string));
  }, []);

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

  const getSigner = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask is not installed");
    return new BrowserProvider(window.ethereum).getSigner();
  }, []);

  const value = useMemo<Wallet>(
    () => ({ hasMetaMask, account, chainId, onOliveChain: chainId === CHAIN.id, connect, switchToOliveChain, getSigner }),
    [hasMetaMask, account, chainId, connect, switchToOliveChain, getSigner],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
