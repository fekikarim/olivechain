export const CHAIN = {
  id: 1337,
  idHex: "0x539",
  networkId: 5777,
  name: "OliveChain (Ganache)",
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:7545",
};

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
