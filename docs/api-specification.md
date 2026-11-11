# 🔌 OliveChain — API & Smart Contract Specification

Comprehensive technical specification for OliveChain's smart contract interfaces, cryptographic data structures, and REST API endpoints.

---

## 1. Smart Contract Reference

### 1.1 `IBatchRegistry.sol` (ERC-721 Interface)

Deployed address managed via `deployments.json`.

#### Data Structures
```solidity
struct Checkpoint {
    bytes32 dataHash;       // SHA3/Keccak-256 digest of laboratory parameters
    uint256 timestamp;      // Timestamp of physical logging
    address recorder;       // Address that recorded the checkpoint
}
```

#### Core Methods

##### `mintBatch(address to, string calldata metadataURI, uint256 initialPrice)`
- **Visibility**: `external`
- **Access**: Authorized producer / farmer
- **Parameters**:
  - `to`: Initial recipient of the batch NFT.
  - `metadataURI`: Off-chain URI (IPFS / JSON) referencing harvest details (cultivar, tree age, parcel ID).
  - `initialPrice`: Baseline price denominated in wei of `OliveCoin` (OLV).
- **Emits**: `BatchMinted(uint256 indexed batchId, address indexed to, uint256 initialPrice)`

##### `transferCustody(uint256 batchId, address newCustodian)`
- **Visibility**: `external`
- **Access**: Current token owner (`custodianOf(batchId)`)
- **Parameters**:
  - `batchId`: Target batch identifier.
  - `newCustodian`: Address of recipient entity.
- **Emits**: `CustodyTransferred(uint256 indexed batchId, address indexed from, address indexed to)`

##### `addCheckpoint(uint256 batchId, bytes32 dataHash)`
- **Visibility**: `external`
- **Access**: Current custodian or authorized `INSPECTOR_ROLE`
- **Parameters**:
  - `batchId`: Target batch identifier.
  - `dataHash`: 32-byte cryptographic digest of off-chain quality report.
- **Emits**: `CheckpointAdded(uint256 indexed batchId, bytes32 dataHash, address indexed recorder)`

##### `certifyBatch(uint256 batchId)`
- **Visibility**: `external`
- **Access**: Strictly restricted to addresses with `INSPECTOR_ROLE`
- **Parameters**:
  - `batchId`: Target batch identifier.
- **Emits**: `BatchCertified(uint256 indexed batchId, address indexed inspector)`

##### `recordSalePrice(uint256 batchId, uint256 price)`
- **Visibility**: `external`
- **Access**: Strictly restricted to authorized `PriceCapEscrow` contract address.
- **Parameters**:
  - `batchId`: Target batch identifier.
  - `price`: Newly agreed and settled transaction price in OLV wei.
- **Emits**: `PriceUpdated(uint256 indexed batchId, uint256 newPrice)`

---

### 1.2 `PriceCapEscrow.sol` (Escrow Clearinghouse)

#### Core Methods

##### `createSale(uint256 batchId, address buyer, uint256 price)`
- **Access**: Must be current custodian of `batchId`.
- **Pre-conditions**:
  - `price <= batchRegistry.getLastPrice(batchId) * (1 + maxMarkupBasisPoints / 10000)`
  - Seller must have approved the escrow contract for NFT transfer.
- **Emits**: `SaleCreated(uint256 indexed saleId, uint256 indexed batchId, address indexed seller, address buyer, uint256 price)`

##### `deposit(uint256 saleId)`
- **Access**: Designated `buyer` of `saleId`.
- **Pre-conditions**:
  - Buyer must have approved escrow contract to spend `price` of `OliveCoin`.
- **Emits**: `FundsDeposited(uint256 indexed saleId, address indexed buyer, uint256 amount)`

##### `release(uint256 saleId)`
- **Access**: `buyer` or authorized escrow mediator.
- **State Changes**:
  - Transfers locked `OliveCoin` to `seller`.
  - Atomically transfers custody NFT to `buyer`.
  - Calls `batchRegistry.recordSalePrice(batchId, price)`.
- **Emits**: `SaleCompleted(uint256 indexed saleId)`

##### `refund(uint256 saleId)`
- **Access**: `buyer` or `seller` prior to batch certification / custody transfer.
- **State Changes**:
  - Refunds locked `OliveCoin` back to `buyer`.
  - Cancels sale order.
- **Emits**: `SaleRefunded(uint256 indexed saleId)`

---

## 2. Backend REST API Endpoints (`olive_backend`)

Base URL: `http://localhost:4000/api`

### 2.1 Health Check
- **Endpoint**: `GET /health`
- **Response**:
```json
{
  "status": "ok",
  "network": {
    "name": "development",
    "chainId": 1337
  },
  "contracts": {
    "registry": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "escrow": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    "coin": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
  }
}
```

### 2.2 Get Batch Overview & History
- **Endpoint**: `GET /api/batches`
- **Description**: Returns all on-chain registered batches aggregated with on-chain checkpoints and custody state.
- **Endpoint**: `GET /api/batches/:id`
- **Response Example**:
```json
{
  "batchId": 1,
  "custodian": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "isCertified": true,
  "lastPrice": "150000000000000000000",
  "metadataURI": "https://api.olivechain.io/metadata/lot-001.json",
  "checkpoints": [
    {
      "dataHash": "0x4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
      "timestamp": 1731110400,
      "recorder": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
    }
  ]
}
```

### 2.3 Off-Chain Laboratory Telemetry Records

#### Post Checkpoint Record
- **Endpoint**: `POST /api/records`
- **Request Body**:
```json
{
  "batchId": 1,
  "acidity": 0.25,
  "polyphenols": 420,
  "temperature": 23.5,
  "location": "Zaghouan, Tunisia",
  "notes": "First cold extraction - organic Chemlali cultivar"
}
```
- **Response**:
```json
{
  "hash": "0x4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
  "record": { ... },
  "verified": true
}
```

#### Fetch & Verify Record by Hash
- **Endpoint**: `GET /api/records/:hash`
- **Description**: Recalculates canonical Keccak-256 digest of stored payload and checks against on-chain checkpoints.
- **Response**:
```json
{
  "hash": "0x4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
  "onChainConfirmed": true,
  "timestamp": 1731110400,
  "telemetry": {
    "acidity": 0.25,
    "polyphenols": 420,
    "temperature": 23.5,
    "location": "Zaghouan, Tunisia"
  }
}
```

### 2.4 Sales & Escrow Queries
- **Endpoint**: `GET /api/sales`
- **Query Params**: `?status=all|active|completed`
- **Endpoint**: `GET /api/sales/:id`
- **Response**: Details on current escrow state, required OLV deposit, seller, buyer, and batch ID.
