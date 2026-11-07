# Rules for the AI Agent — OliveChain Mini

Read this file and `olive_idea1.md` fully before writing any code. These rules apply to every task, every session.

**Two developers work on this project, each with their own AI agent session.**
- **Person A** owns `BatchRegistry` (NFT) and has `roadmap-A.md`.
- **Person B** owns `OliveCoin` + `PriceCapEscrow` (FT) and has `roadmap-B.md`.

## 0. First Thing To Do: Know Who You Work For, Then Roadmap

1. **Identify the developer.** At the start of every session, if the user has not said whether they are Person A or Person B, ask once: "Are you Person A (BatchRegistry) or Person B (OliveCoin + Escrow)?" Do not guess.
2. **You only work on that person's roadmap and that person's files.** Person A's agent never edits `roadmap-B.md` or Person B's contracts, and vice versa.
3. If the developer's roadmap file (`roadmap-A.md` or `roadmap-B.md`) does not exist, **create it before writing any code**. Create only your own person's roadmap, never the other one.
4. Split that person's part of the project into small, ordered, step-by-step tasks. Each task must be small enough to finish and test in one sitting.
5. Use this format for every task (the ID prefix matches the person):

```
- [ ] A01 | Title | Depends on: - | Done when: <clear, testable condition>
- [ ] B01 | Title | Depends on: A03 | Done when: <clear, testable condition>
```

6. Statuses: `[ ]` todo, `[~]` in progress, `[x]` done, `[!]` blocked (write why).
7. **Update your roadmap every time a task is finished**, in the same step. Never batch updates for later.
8. Keep a `## Current State` section at the top of your roadmap with: last completed task, next task, open problems, and the date. A new session must be able to continue from there without asking questions.
9. Keep a `## Decisions Log` section in your roadmap: any choice that changes the design (with one line of reason).
10. Keep a `## Needs From The Other Person` section: anything you are waiting on (for example "needs A's `IBatchRegistry` merged") and anything you must deliver for them. Cross-person dependencies are written here and in the `Depends on` field, never silently assumed.
11. If a task turns out to be too big, split it in the roadmap before continuing.
12. Never mark a task done unless its tests pass.

### Shared work

Some files belong to both people: the interfaces, `truffle-config.js`, `migrations/`, and `test/integration/`.
- **Interfaces first.** The very first tasks of both roadmaps are the same: agree on and commit `IBatchRegistry.sol` (and `IOliveCoin.sol` if needed). Person A proposes it, Person B reviews it. Neither agent changes an interface after it is agreed without the user telling the other developer.
- Add a line to your roadmap's Decisions Log whenever you touch a shared file, and tell the user so they can inform their partner.
- While the other person's contract is not ready, test against a **mock** of their interface (`contracts/mocks/`). Never copy or reimplement the other person's logic to unblock yourself.
- Integration tests (`test/integration/`) are written only after both contracts are done. Put them as the last tasks in both roadmaps, and note who writes them.

## 1. Tech Stack

- Solidity (pin one version in `truffle-config.js`, e.g. `0.8.24`, and never change it mid-project)
- Truffle for compile, migrate and test
- Ganache for the local chain
- MetaMask connected to Ganache for manual demos
- Next.js (App Router, TypeScript) + ethers v6 for the web UI in `olive_web/` (its own folder, next to the Truffle project `olive_blockchain/`), connected to the Truffle build artifacts
- OpenZeppelin contracts for ERC-721 and ERC-20 (do not re-implement standards)

## 2. Clean Architecture

Keep responsibilities separated, one reason to change per file.

```
olive_blockchain/      # Truffle project (contracts only)
  contracts/
    interfaces/        # IBatchRegistry.sol, IOliveCoin.sol (only function signatures)
    registry/          # Person A: BatchRegistry.sol
    payment/           # Person B: OliveCoin.sol, PriceCapEscrow.sol
    libraries/         # pure helpers only (e.g. PriceMath.sol), only if reused
    mocks/             # test-only mocks of the other person's interface
  migrations/
  test/
    registry/          # Person A
    payment/           # Person B
    integration/       # shared, written last
  roadmap-A.md         # Person A only
  roadmap-B.md         # Person B only
olive_web/             # Next.js (TS) UI, separate from the Truffle project
  src/lib/             # shared: wallet, chain config, contract loading
  src/contracts/       # generated from olive_blockchain/build/contracts (never edit by hand)
  src/features/registry/  # Person A: batch screens + hooks (olive lots, custody, checkpoints)
  src/features/payment/   # Person B: OliveCoin + escrow screens + hooks
architecture.md        # shared: how the pieces fit together
rules.md
olive_idea1.md
```

**Ownership**
- Person A owns: `contracts/registry/`, `test/registry/`, `olive_web/src/features/registry/`, `roadmap-A.md`
- Person B owns: `contracts/payment/`, `test/payment/`, `olive_web/src/features/payment/`, `roadmap-B.md`
- Shared (change only with a log entry): `contracts/interfaces/`, `migrations/`, `truffle-config.js`, `test/integration/`, `olive_web/` outside the two `features/` folders (layout, `src/lib/`, `src/app/` routing, config)

- **Contracts talk only through interfaces.** `PriceCapEscrow` imports `IBatchRegistry`, never `BatchRegistry`.
- The registry never calls the escrow. The only allowed write from the escrow to the registry is `recordSalePrice`, restricted to the authorized escrow address.
- Neither contract may contain logic that belongs to the other. A's contract has no balances or payment logic. B's contract has no custody, inspection or batch storage logic. **If one contract could replace the other, the design is wrong.**
- One contract per file, one responsibility per function.
- Agree on `IBatchRegistry.sol` first. Both developers code against it.

## 2a. Web UI Rules

- The UI is a thin client: it reads from and sends transactions to the contracts. **No business rule lives only in the UI** (price cap, certification check, custody check are enforced on-chain; the UI may pre-check them only to show a friendly message).
- The UI talks to contracts only through the generated ABIs in `olive_web/src/contracts/` (`npm run migrate` in `olive_blockchain/` migrates and syncs; `npm run dev`/`build` in `olive_web/` also sync). Never hardcode ABIs or addresses.
- MetaMask is the only signer. Never ask for, store or log private keys in the UI.
- Each person builds the screens for their own contract inside their `features/` folder. Shared code (`src/lib/`, layout, nav) changes only with a Decisions Log entry.
- UI tasks go in each roadmap after the matching contract task is done and tested. A UI task is done when it works against Ganache through MetaMask and `npm run build` passes.

## 3. Gas Rules (every line costs money)

Be direct, minimal and clean. Every storage write and every extra line has a cost.

**Do**
- Write the simplest code that satisfies the requirement.
- Store as little as possible on-chain. Keep big data (quality lab reports, certificates, images) off-chain and store only a hash or URI.
- Use `bytes32` hashes for checkpoint data (acidity %, polyphenols, extraction temperature) instead of long strings.
- Use `external` for functions only called from outside, `calldata` for read-only array/struct/string parameters.
- Use `immutable` and `constant` for values that never change.
- Pack storage variables (group small types like `uint64`, `uint32`, `bool`, `address` together).
- Cache storage reads in a local variable when a value is used more than once in a function.
- Use `custom errors` (`error NotInspector();`, `error NotCertified();`) instead of revert strings.
- Use `mapping` for lookups. Avoid arrays you have to loop over.
- Emit events for history that does not need to be read by contracts (checkpoints, quality logs), instead of storing it in arrays.
- Use `unchecked` only for provably safe arithmetic, with a comment explaining why.
- Validate inputs early and revert early, so failed calls waste less gas.

**Don't**
- Don't loop over unbounded arrays on-chain.
- Don't store anything that can be derived, recomputed off-chain or read from events.
- Don't add "just in case" functions, fields, roles or events.
- Don't duplicate checks that are already done by an OpenZeppelin base contract.
- Don't use strings where an enum, `uint` or `bytes32` works.
- Don't make storage variables `public` if nothing needs the auto getter.
- Don't refactor or rename working code without a reason written in the Decisions Log. No unnecessary changes.
- Don't redeploy or change deployed contract behavior for cosmetic reasons.

## 4. Security Rules

- Use access control on every state-changing function (`onlyOwner`, `onlyInspector`, `onlyEscrow`, etc.).
- Follow checks → effects → interactions. Update state before any external call or token transfer.
- Protect `releasePayment` and `refund` against reentrancy (`ReentrancyGuard` or strict ordering).
- Use `SafeERC20` patterns or check return values on token transfers.
- Never use `tx.origin` for auth. Never hardcode private keys, mnemonics or secrets in code or in the repo.
- Use `.env` for keys (git-ignored) and commit `.env.example` only.
- Check for zero address on every address input.
- One sale can only be released or refunded once. Make the state machine explicit.

## 5. Code Style

- Naming: contracts `PascalCase`, functions and variables `camelCase`, constants `UPPER_SNAKE_CASE`, private/internal state with a leading underscore.
- Short NatSpec on every external function (`@notice`, `@param`). Short comments only for non-obvious logic.
- No dead code, no commented-out code, no TODOs left in finished tasks.
- Keep functions short. If a function does two things, split it.

## 6. Testing Rules

- Write tests with the code, not after. A task is not done without tests.
- Cover for each contract: happy path, every revert path, every access control rule, every event.
- Integration tests must cover the demo scenarios in `olive_idea1.md` section 8 (including the rejected overpriced sale, uncertified batch, and custody mismatch).
- Run `truffle test` before marking any task done. Report gas usage (`truffle test` with the gas reporter if available) and flag any function that looks expensive.
- Test on Ganache first. No testnet deployment unless asked.

## 7. Git and Workflow

- Small commits, one task per commit, message format: `A07: add certifyBatch with inspector role` (prefix with your task ID).
- Each person works on their own branch (`person-a`, `person-b`) and merges to `main` through the user. Pull `main` before starting a new task to pick up the partner's changes (especially interfaces).
- Do not touch files owned by the other person. If you think a change is needed there, write it under `Needs From The Other Person` in your roadmap and tell the user.
- Never commit `node_modules`, `build/`, `.env`.

## 8. How The Agent Must Behave

**Do**
- Confirm whether you are working for Person A or Person B, then read only that person's roadmap at the start of every session and continue from `Current State`. Also check the other roadmap's `Current State` (read-only) to see if a dependency has been delivered.
- Do one task at a time, finish it, test it, update the roadmap, then move on.
- Ask before changing anything in `olive_idea1.md` or the interface files.
- Explain in one or two lines what was done and what is next.
- Tell the user when a requirement is unclear instead of guessing.

**Don't**
- Don't start coding before your person's roadmap exists.
- Don't edit the other person's roadmap, contracts or tests.
- Don't reimplement the other person's logic inside your contract to avoid waiting. Use a mock.
- Don't add features outside `olive_idea1.md` (no game client, no extra tokens, no extra contracts). The web UI is allowed (see §2a) but must only expose what the contracts do.
- Don't merge the two contracts or move logic between them to "simplify".
- Don't change the Solidity version, dependencies or folder structure without logging it.
- Don't skip tests to save time.
- Don't leave the roadmap outdated at the end of a session.

## 9. Definition of Done (per task)

- [ ] Code compiles with no warnings
- [ ] Tests written and passing
- [ ] Gas-conscious (no unnecessary storage or lines)
- [ ] Access control checked
- [ ] Your roadmap (`roadmap-A.md` or `roadmap-B.md`) updated (status + Current State)
- [ ] Any shared file touched is logged, and the user is told so they can inform their partner
