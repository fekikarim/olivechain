# OliveChain Mini

Chain of custody for olive oil batches (NFT) plus a price-cap escrow (FT), on a local Ganache chain.
Tracks the journey of an olive oil lot from the **farmer's grove** through the **olive mill**, the **bottler / distributor**, and on to the **grocery retailer** — with quality certification and markup control at every step.
All assets are **simulated**. There are no real goods or payments.

| Doc | What |
|-----|------|
| [olive_idea1.md](olive_idea1.md) | The product idea and demo scenarios |
| [rules.md](rules.md) | Team and coding rules (read first) |
| [architecture.md](architecture.md) | How the contracts and the web app fit together |
| [olive_blockchain/configuration.md](olive_blockchain/configuration.md) | Ganache, MetaMask and Truffle setup |
| [olive_blockchain/roadmap-A.md](olive_blockchain/roadmap-A.md) | Person A tasks (BatchRegistry) |
| [DEMO.md](DEMO.md) | **5–7 min teacher demo script** + simple explanation + likely questions |
| [manual-test-A.md](manual-test-A.md) | Person A manual test checklist (contract + UI with MetaMask) |
| [olive_blockchain/roadmap-B.md](olive_blockchain/roadmap-B.md) | Person B tasks (OliveCoin + PriceCapEscrow) |
| [olive_web/DESIGN_SYSTEM.md](olive_web/DESIGN_SYSTEM.md) | UI look and rules: colors, type, components, words |

## Quick start

Prerequisites: Node 22, Truffle 5.11, Ganache GUI on `127.0.0.1:7545` (network 5777, chain 1337), MetaMask.

```bash
cd olive_blockchain && npm install && npm test   # contract tests on Ganache
npm run migrate                                  # deploy + sync ABIs into olive_web
cd ../olive_web && npm install && npm run dev    # http://localhost:3000
```

No MetaMask needed for a demo: the app starts in **Demo mode** (act as any Ganache account from the top-right menu). The in-app **Guide** (`/guide`) walks through the whole supply chain story.

## Supply chain at a glance

```
Farmer          Mints olive lot NFT with initial price
   │
   ▼ transferCustody
Mill Operator   Cold-presses olives; inspector adds checkpoint (acidity, polyphenols)
   │
   ▼ certifyBatch (inspector)
Distributor     Lists the bottled lot for sale (escrow rejects if price > cap)
   │
   ▼ deposit (grocery)
Grocery         Deposits OLV; distributor transfers custody
   │
   ▼ releasePayment
                OLV reaches the distributor; registry records the new last price
```

## Progress — Person A (BatchRegistry)

| Task | Status | What |
|------|--------|------|
| A00 | ⬜ | Project init: toolchain, folders, Next.js app, docs |
| A01 | ⬜ | `IBatchRegistry.sol` draft |
| A02 | ⬜ | Interface reviewed by Person B: **v1 frozen** |
| A03–A09 | ⬜ | `BatchRegistry` contract: mint, custody, checkpoints, certification, sale price |
| A09b | ⬜ | Re-check against frozen interface (full test suite) |
| A10 | ⬜ | Coverage + gas report (`npm run test:gas`) |
| A11 | ⬜ | Registry migration (`npm run migrate`) |
| A12 | ⬜ | UI: batch list + detail with event history (`/registry`) |
| A13 | ⬜ | UI: mint form (MetaMask-signed, shows decoded revert reasons) |
| A14 | ⬜ | UI: custody transfer, add checkpoint, certify (with role hints) |
| A15 | ⬜ | UI: regulator panel (grant/revoke inspector, set escrow) |
| A16 | ⬜ | Integration tests: full supply-chain scenarios with A + B contracts (`test/integration/`) |
| A17 | ⬜ | End-to-end demo through the UI (see [DEMO.md](DEMO.md)) |

✅ done · ⏳ waiting on someone · ⬜ todo · ⛔ blocked

## Progress — Person B (OliveCoin + PriceCapEscrow)

| Task | Status | What |
|------|--------|------|
| B00–B01 | ⬜ | Roadmap + interface review |
| B02 | ⬜ | Interface v1 frozen |
| B03–B10 | ⬜ | `OliveCoin` + `PriceCapEscrow` (cap, deposit, release, refund), mock registry, gas pass |
| B11 | ⬜ | Payment migration (OliveCoin, escrow at 20%, `setEscrow`) |
| B12–B15 | ⬜ | UI `/market`: OLV balance, authority panel, sales, cap pre-check, buy, release, refund |
| B16–B17 | ⬜ | Integration tests + end-to-end demo |

## Tests

```bash
cd olive_blockchain && npm test   # target: registry + payment + integration suites
```

## Contracts overview

| Contract | Standard | Symbol | Purpose |
|----------|----------|--------|---------|
| `BatchRegistry` | ERC-721 | — | One NFT per olive oil batch; tracks custody, checkpoints, certification, last price |
| `OliveCoin` | ERC-20 | OLV | Fungible payment token used in the escrow |
| `PriceCapEscrow` | — | — | Holds OLV in escrow; enforces the markup cap; releases on certified delivery |

The only link between contracts is `IBatchRegistry`: `PriceCapEscrow` reads `isCertified`, `getLastPrice` and `custodianOf`, and writes `recordSalePrice`. `BatchRegistry` never calls the escrow.
