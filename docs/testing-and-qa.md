# 🧪 OliveChain — Testing, Verification & Quality Assurance

Comprehensive documentation of test suites, coverage, validation procedures, and simulated supply-chain scenarios.

---

## 1. Overview of Test Architecture

OliveChain uses a multi-layered verification strategy to guarantee protocol safety:
1. **Smart Contract Unit Tests**: Granular tests targeting access boundaries, state transitions, custom error reverts, and boundary calculations.
2. **End-to-End Smart Contract Integration Tests**: Simulating the complete multi-actor Mediterranean olive oil trade lifecycle.
3. **Backend Integration & Oracle Tests**: Testing hash verification, REST endpoints, and event synchronizers.
4. **Interactive Journey Simulation**: Next.js-driven deterministic 8-step journey verification.

---

## 2. Smart Contract Test Suites (`olive_blockchain/test`)

The smart contract test suite consists of **49 automated tests** executed using Truffle's Mocha/Chai framework.

### 2.1 Registry Test Suite (`test/registry/BatchRegistry.test.js`)
- **NFT Minting**:
  - Successfully mints with incremental `batchId`.
  - Assigns initial custodian accurately.
  - Verifies event `BatchMinted` with indexed fields.
- **Custody Transitions**:
  - Reverts when non-custodian attempts `transferCustody`.
  - Successfully hands over custody from Farmer $\rightarrow$ Mill $\rightarrow$ Distributor $\rightarrow$ Retailer.
  - Emits `CustodyTransferred`.
- **Quality Checkpoints**:
  - Allows current custodian and authorized inspectors to append 32-byte telemetry hashes.
  - Reverts on unauthorized third-party attempts (`Unauthorized()`).
  - Preserves chronological append-only checkpoint arrays.
- **Certification Protocol**:
  - Reverts when non-inspector calls `certifyBatch()`.
  - Sets `isCertified = true` upon inspector invocation.
  - Protects against double-certification side effects.

### 2.2 Payment & Escrow Test Suite (`test/payment/PriceCapEscrow.test.js`)
- **ERC-20 Settlement Engine (`OliveCoin`)**:
  - Standard transfer, allowance, and minter role checks.
- **Price-Cap Math Verification**:
  - Computes allowable price increases based on `maxMarkupBasisPoints` (e.g., 20% cap).
  - Reverts transactions exceeding the markup with `PriceExceedsCap()`.
  - Permits fair transactions within or below the cap.
- **Escrow Lifecycle**:
  - `createSale`: Locks NFT intent and sets up trade terms.
  - `deposit`: Verifies token allowance and escrow balance custody.
  - `release`: Atomically transfers OLV tokens to seller and batch NFT to buyer.
  - `refund`: Reverts release once certified and delivered, or executes valid refund prior to settlement.

### 2.3 Comprehensive Integration Suite (`test/integration/SupplyChain.test.js`)
Simulates the canonical 5-actor lifecycle:
1. **Farmer** mints Lot #1 with initial price 100 OLV.
2. **Farmer** hands custody to **Mill Operator**.
3. **Mill Operator** appends cold-press extraction parameters.
4. **Inspector** runs laboratory assays, logs hash, and calls `certifyBatch`.
5. **Mill Operator** lists batch for sale to **Distributor** at 115 OLV (fair price $\le 120$ OLV cap).
6. **Distributor** deposits 115 OLV into escrow.
7. **Distributor** releases funds $\rightarrow$ receives NFT custody.
8. **Distributor** lists batch for sale to **Retailer** at 135 OLV ($\le 138$ OLV cap).
9. **Retailer** pays and finalizes purchase $\rightarrow$ Final chain of custody complete.

---

## 3. Backend Test Suite (`olive_backend/test`)

Built on Node's native test runner (`node:test`):
- Verifies `/health` responsiveness and contract address sync.
- Validates determinism of Keccak-256 computation in `records.js`.
- Ensures invalid hashes are rejected.
- Tests query filters on indexed batch checkpoints.

---

## 4. Running the Tests

### Blockchain Suite
```bash
cd olive_blockchain
npm test
```
Expected output:
```
  Contract: BatchRegistry
    ✓ allows authorized minting of olive oil lot (74ms)
    ✓ tracks custody transitions across supply chain actors (62ms)
    ✓ rejects unauthorized checkpoint submissions (49ms)
    ...
  Contract: PriceCapEscrow
    ✓ enforces regulatory price cap on markup (88ms)
    ✓ atomically settles OLV payment and NFT custody transfer (104ms)
    ✓ handles refund clauses correctly (82ms)

  49 passing (4.2s)
```

### Backend Suite
```bash
cd olive_backend
npm test
```
Expected output:
```
✔ health endpoint returns ok (14ms)
✔ computes correct keccak256 hash for telemetry (5ms)
✔ validates and retrieves stored record (18ms)
```
