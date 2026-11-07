# OliveChain

Olive oil chain of custody (ERC-721 NFT) and price-cap escrow (ERC-20 OLV). Simulated assets on a local Ganache chain.
Spec in `todo/`, progress in [ROADMAP.md](ROADMAP.md).

| Folder | What |
|--------|------|
| `olive_blockchain` | Truffle 5.11, solc 0.8.24, OpenZeppelin 5.0.2: `BatchRegistry` (NFT), `OliveCoin` (FT), `PriceCapEscrow` |
| `olive_backend` | Node.js + Express + ethers: batch/sale/balance API and off-chain checkpoint records (hash-verified) |
| `olive_web` | Next.js 16 + ethers + MetaMask UI |

## Run (Ganache GUI on 127.0.0.1:7545, network 5777, chain 1337)

```bash
cd olive_blockchain && npm install && npm test        # 49 tests
npm run migrate                                       # deploy + sync ABIs to web and backend
npm run demo                                          # optional: play the whole supply chain
cd ../olive_backend && npm install && npm start       # http://localhost:4000
cd ../olive_web && npm install && npm run dev         # http://localhost:3000
```

MetaMask: add network RPC `http://127.0.0.1:7545`, chain ID 1337 (the header button does it), import Ganache accounts. `/guide` lists the roles.
