# OliveChain — Roadmap (resume from here)

Spec: `todo/` (idea, rules, architecture). One developer plays both Person A (NFT) and Person B (FT).
Stack: Ganache GUI (127.0.0.1:7545, net 5777, chain 1337) · Truffle 5.11 (solc 0.8.24, paris, OZ 5.0.2)
· Node.js backend (`olive_backend`, Express + ethers) · Next.js frontend (`olive_web`) · MetaMask.

## Current State
- Last completed: Batches 1-5 and 6.1-6.3 (automated)
- Next (batch 7 done): manual MetaMask walkthrough of /journey (todo/manual-test-A.md + todo/DEMO flow in /guide); optional polish
- Open problems: MetaMask-signed UI flows not exercised by automation (no extension in the test browser); no gas reporter plugin (truffle has none built in)
- Updated: 2026-11-07

Status: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

## Batch 1 — Contracts (olive_blockchain)
- [x] 1.1 Truffle project: package.json, truffle-config (paris, optimizer), OZ 5.0.2 | Done when: `truffle compile` ok
- [x] 1.2 `IBatchRegistry.sol` | Done when: compiles
- [x] 1.3 `BatchRegistry.sol` (ERC-721 NFT: mint, custody, checkpoints, certify, price) | Done when: compiles, no warnings
- [x] 1.4 `OliveCoin.sol` (ERC-20 FT, OLV) | Done when: compiles
- [x] 1.5 `PriceCapEscrow.sol` (cap, deposit, release, refund, cancel) | Done when: compiles
- [x] 1.6 `MockBatchRegistry.sol` for escrow tests

## Batch 2 — Tests + deploy
- [x] 2.1 Registry tests (access control, reverts, events)
- [x] 2.2 Payment tests (OLV + escrow vs mock)
- [x] 2.3 Integration tests: all scenarios of olive_idea1 §8
- [x] 2.4 Migrations (registry → coin → escrow → setEscrow, mint demo OLV, grant inspector) + `sync-contracts` script
- [x] 2.5 `npm run migrate` on Ganache works; gas report

## Batch 3 — Backend (olive_backend)
- [x] 3.1 Express app + ethers reading deployments
- [x] 3.2 Endpoints: health, batches (+history from events), sales, OLV balance
- [x] 3.3 Off-chain checkpoint records: POST verifies keccak hash, GET by hash
- [x] 3.4 Backend tests (node:test) + smoke run vs Ganache

## Batch 4 — Frontend foundation (olive_web)
- [x] 4.1 Next.js (TS, Tailwind) scaffold, olive design tokens
- [x] 4.2 lib: chain, contracts, WalletProvider (MetaMask, add/switch Ganache)
- [x] 4.3 Layout, nav, home status page

## Batch 5 — Frontend features
- [x] 5.1 /registry: list + detail + event history
- [x] 5.2 Mint, transfer custody, checkpoint, certify (decoded revert errors)
- [x] 5.3 Regulator panel (inspectors, escrow)
- [x] 5.4 /market: OLV balance + authority mint, create sale (cap pre-check), deposit, release, refund, cancel
- [x] 5.5 Guide page (supply chain story)

## Batch 6 — Verify + docs
- [x] 6.1 `npm run build` web ok, tests all green
- [x] 6.2 Full E2E on Ganache (script) + README quick start
- [x] 6.3 Update this file and todo/README progress

## Batch 7 — UX pass (guided workflow)
- [x] 7.1 Role lookup from Ganache (`src/lib/roles.ts`): header shows the role name of the connected account
- [x] 7.2 `/journey` guided demo: 8 steps, progress read from chain, actions inline, account named per step, wrong-account blocking
- [x] 7.3 Optional "try an unfair price" step shows the escrow refusing a price above the cap
- [x] 7.4 Rewritten `/guide`: setup checklist, six accounts with copy buttons, steps, expected failures, troubleshooting
- [x] 7.5 Home, header and Registry/Market hints point to the guided demo
- [x] 7.6 Step logic checked against 9 chain states (`logic.ts`, run under Node, not committed as a test file)
- [ ] 7.7 Full MetaMask walkthrough in a real wallet (not possible in the test browser)

## Batch 8 — Identity, demo users and role-scoped views
- [x] 8.1 Demo users: act as any Ganache account on the People page (testing only); "Connect MetaMask" replaces the demo user
- [x] 8.2 Sticky header with who you are, and a live status bar: current demo step, who it is for, who you are
- [x] 8.3 Batches list scoped to the user (My batches / All), clickable cards, eligibility shown per action
- [x] 8.4 Market: sale cards with progress, gated actions, batch picked from the holder's own batches
- [x] 8.5 Dry-run before each MetaMask/demo transaction so custom errors are shown, not "missing revert data"
- [ ] 8.6 Phone header is tall (nav + identity + status bar); collapse into a menu
- [ ] 8.7 Live test of a rejected action and of the dry-run error text

## Decisions Log
- Single ROADMAP.md at repo root (user is both A and B).
- Custody == ERC-721 ownership; `_update` emits `CustodyTransferred` for every transfer.
- Refund blocked once batch is certified AND custody is with buyer (buyer must release instead).
- Backend added (user request): off-chain checkpoint records + event indexing API; frontend reads chain directly, uses backend for records.
- No gas-report script: Truffle ships no reporter; gas-minded patterns applied instead (packed struct, events for history, custom errors, immutables).
- `npm run demo` (olive_blockchain) replays the full supply chain on Ganache.
