# 🏛️ OliveChain — Architectural Whitepaper & System Design

**OliveChain** is a decentralized provenance, quality certification, and anti-speculation escrow platform engineered for the high-grade agricultural supply chain (specializing in Extra Virgin Olive Oil — EVOO). 

By uniting **ERC-721 non-fungible physical digital twins** with an **ERC-20 anti-speculation escrow engine**, OliveChain bridges on-chain immutability with Mediterranean agri-food verification protocols.

---

## 1. High-Level Architecture Overview

OliveChain is structured as a 3-tier decentralized enterprise application:
1. **Consensus & Smart Contract Layer (`olive_blockchain`)**: Ethereum/EVM compatible smart contracts deployed using Truffle & OpenZeppelin.
2. **Oracle & Off-chain Indexer Service (`olive_backend`)**: Node.js/Express service computing cryptographic proofs, managing JSON off-chain laboratory telemetry, and validating Keccak-256 state hashes.
3. **Decentralized Application Frontend (`olive_web`)**: Next.js 16 App Router UI with Tailwind CSS, Ethers.js v6, MetaMask connector, and simulated multi-actor role-switching.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PRESENTATION LAYER                                    │
│                            Next.js 16 App Router (olive_web)                            │
│   • Multi-Actor Journey Mode     • Live Chain Status Dashboard  • Batch Registry Views  │
│   • MetaMask Browser Provider    • Escrow & Market Operations   • Off-chain Verifier    │
└────────────────────────────┬─────────────────────────────┬──────────────────────────────┘
                             │                             │
              Direct RPC     │                             │ REST API & Telemetry
              Calls (Read/Tx)│                             │ (Off-chain Lab Data)
                             ▼                             ▼
┌──────────────────────────────────────────┐   ┌──────────────────────────────────────────┐
│              CONSENSUS LAYER             │   │             APPLICATION LAYER            │
│       EVM Blockchain (olive_blockchain)  │   │       Node.js / Express (olive_backend)  │
│                                          │   │                                          │
│  ┌────────────────────────────────────┐  │   │  ┌────────────────────────────────────┐  │
│  │   BatchRegistry.sol (ERC-721)      │  │   │  │   Keccak-256 Telemetry Validator   │  │
│  │   - NFT Digital Twin of physical   │  │   │  │   - Computes deterministic hash of │  │
│  │     olive lot                      │  │   │  │     acidity, polyphenols, location │  │
│  │   - On-chain Custody State         │  │   │  │   - Verifies against on-chain hash │  │
│  │   - Quality Checkpoint Ledger      │  │   │  └────────────────────────────────────┘  │
│  │   - Certified Lab Attestation      │  │   │  ┌────────────────────────────────────┐  │
│  └─────────────────▲──────────────────┘  │   │  │   Event Indexer & Query Service    │  │
│                    │                     │   │  │   - Aggregates block events        │  │
│      IBatchRegistry│ Interface (Price/   │   │  │   - Exposes REST endpoints         │  │
│                    │  Custody/Certified) │   │  └────────────────────────────────────┘  │
│  ┌─────────────────▼──────────────────┐  │   └──────────────────────────────────────────┘
│  │   PriceCapEscrow.sol               │  │
│  │   - Conditional Fund Lock (OLV)    │  │
│  │   - Regulatory Price Markup Cap    │  │
│  │   - Atomic Settlement & Custody    │  │
│  └─────────────────▲──────────────────┘  │
│                    │                     │
│  ┌─────────────────▼──────────────────┐  │
│  │   OliveCoin.sol (ERC-20)           │  │
│  │   - Native Settlement Token (OLV)  │  │
│  │   - Supply Chain Liquidity Engine  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

---

## 2. Smart Contract Topology & Security Boundaries

### 2.1 `BatchRegistry.sol` (ERC-721 Digital Twin)
- **ERC-721 Implementation**: Standardized unique lot representation inheriting from `@openzeppelin/contracts/token/ERC721/ERC721.sol`.
- **Custody Tracking**: The token holder represents the current physical custodian. State transitions occur via `transferCustody` or through settled escrow atomic transfers.
- **On-chain Checkpoints**:
  ```solidity
  struct Checkpoint {
      bytes32 dataHash;      // Keccak-256 hash of laboratory telemetry
      uint256 timestamp;     // Block timestamp
      address recorder;      // Authorized custodian or inspector address
  }
  ```
- **Access Control & Certification**: 
  - Regulated via `DEFAULT_ADMIN_ROLE` and `INSPECTOR_ROLE`.
  - Only registered quality inspectors can invoke `certifyBatch(uint256 batchId)`.
  - `recordSalePrice(uint256 batchId, uint256 price)` is strictly gated to the authorized `PriceCapEscrow` contract address.

### 2.2 `PriceCapEscrow.sol` (Anti-Speculation Clearinghouse)
- **Anti-Price-Gouging Math**:
  Enforces a strict percentage markup ceiling per transaction:
  $$\text{MaxAllowedPrice} = \text{LastRecordedPrice} \times \left(1 + \frac{\text{MaxMarkupBasisPoints}}{10000}\right)$$
  Attempts to create a sale where $\text{Price} > \text{MaxAllowedPrice}$ immediately revert with custom error `PriceExceedsCap()`.
- **Atomic Custody and Escrow States**:
  - `Created`: Seller registers sale order linked to `batchId`.
  - `Funded`: Buyer deposits required `OliveCoin` amount.
  - `Released`: Buyer confirms physical inspection and releases OLV payment to seller; custody NFT is transferred.
  - `Refunded`: Buyer receives funds back under pre-certified cancellation clauses.

### 2.3 `OliveCoin.sol` (ERC-20 Settlement Asset)
- OpenZeppelin standard ERC-20 (`OLV`) with 18 decimals.
- Minter role assigned to market governance authority to simulate trade financing and supply-chain liquidity.

---

## 3. Cryptographic Off-Chain Data Integrity Pattern

To preserve low gas consumption while guaranteeing laboratory-grade proof of quality, OliveChain implements a **Cryptographic Hash Anchor Pattern**:

```
[ Lab Telemetry JSON ] ──> Keccak-256 ──> bytes32 dataHash ──> BatchRegistry.addCheckpoint()
{
  "acidity": 0.22,
  "polyphenols": 480,
  "temperature": 24.5,
  "origin": "Sfax, Tunisia"
}
```

1. Quality laboratories generate rich telemetry records (polyphenol content, peroxide values, fatty acid profiles, geo-coordinates).
2. The payload is normalized and hashed via `keccak256(canonicalPayload)`.
3. Only the 32-byte cryptographic digest is submitted on-chain via `addCheckpoint(batchId, dataHash)`.
4. Off-chain consumers verify data authenticity by submitting the JSON payload to `GET /api/records/:hash`, where `olive_backend` performs hash recalculation and cross-checks the chain.

---

## 4. Actors & Role Matrix

| Actor | Typical Stakeholder | Primary On-Chain Interactions | Key Permissions |
|---|---|---|---|
| **Farmer** | Agricultural Producer | `mintBatch`, `transferCustody` | Initial batch registration, initial price setting |
| **Mill Operator** | Cold-pressing Facility | `addCheckpoint`, `createSale`, `transferCustody` | Extraction parameters recording, wholesale escrow |
| **Inspector** | Certified Agri-Food Laboratory | `addCheckpoint`, `certifyBatch` | Quality attestation, EVOO certification stamp |
| **Distributor** | Logistics & Bottling Hub | `deposit`, `release`, `createSale` | Intermediate liquidity provider, transport tracking |
| **Retailer** | Supermarket / Gourmet Merchant | `deposit`, `release` | Final consumer-facing purchasing & custody receipt |
| **Market Authority** | Regulatory Board | `setMaxMarkup`, `mint` (OLV) | Monitory supervision, price inflation capping |

---

## 5. Security & Gas Engineering

- **Solidity 0.8.24 (`paris` target)**: Employs built-in checked arithmetic to prevent overflow/underflow vulnerabilities without `SafeMath`.
- **Reentrancy Protection**: Critical financial state transitions in `PriceCapEscrow.sol` utilize Checks-Effects-Interactions (CEI) patterns.
- **Custom Errors**: Replaces verbose revert strings with parameter-packed custom errors (e.g., `Unauthorized()`, `PriceExceedsCap()`, `BatchNotCertified()`), minimizing deployment bytecode and execution gas overhead.
- **Immutables & Storage Optimization**: Cache-conscious layout of storage slots in `BatchRegistry` struct arrays.
