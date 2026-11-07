"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ContractTransactionResponse } from "ethers";
import { errorMessage } from "./format";

/** Loads chain data; `reload` refetches after a transaction. */
export function useLoad<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async () => {
    try {
      setData(await loaderRef.current());
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [reload, ...deps]);
  return { data, error, loading, reload };
}

/** Wraps a MetaMask-signed transaction with pending / error / success state. */
export function useTx(onDone?: () => void | Promise<void>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const run = useCallback(async (label: string, send: () => Promise<ContractTransactionResponse>) => {
    setPending(true); setError(null); setDone(null);
    try {
      const tx = await send();
      await tx.wait();
      setDone(label);
      await onDone?.();
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    } finally {
      setPending(false);
    }
  }, [onDone]);

  return { pending, error, done, run };
}

import { type Contract } from "ethers";
import { getContract, type ContractName } from "./contracts";
import { useWallet } from "./wallet";

/** Returns a function that gives a MetaMask-signed contract, or throws a readable error. */
export function useWrite() {
  const w = useWallet();
  return useCallback(async (name: ContractName): Promise<Contract> => {
    if (!w.account) throw new Error("Connect MetaMask first.");
    if (!w.onOliveChain) throw new Error("Switch MetaMask to OliveChain (Ganache, chain 1337).");
    const c = getContract(name, await w.getSigner());
    if (!c) throw new Error(`${name} is not deployed. Run npm run migrate in olive_blockchain.`);
    return c;
  }, [w]);
}
