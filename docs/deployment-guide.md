# 📘 OliveChain — Developer & Deployment Guide

This guide provides end-to-end instructions for deploying, testing, running, and debugging the entire OliveChain ecosystem across the blockchain contracts, backend REST API, and Next.js decentralized application.

---

## 1. Prerequisites & Environment Setup

Ensure the following tools are installed:
- **Node.js**: `v18.x` or `v20.x` LTS
- **npm**: `v9.x` or higher
- **Ganache**: Ganache GUI or `ganache-cli`
- **MetaMask**: Browser extension for Chrome / Brave / Firefox

### Ganache Local Chain Configuration
Set up your local Ethereum blockchain workspace in Ganache with the following parameters:
- **RPC Server**: `HTTP://127.0.0.1:7545`
- **Network ID**: `5777`
- **Chain ID**: `1337`
- **Automining**: Enabled (default block gas limit: 6,721,975)
- **Mnemonic / Accounts**: Create 10 funded accounts with 100 ETH each.

---

## 2. Smart Contract Subsystem (`olive_blockchain`)

### 2.1 Installation
```bash
cd olive_blockchain
npm install
```

### 2.2 Compilation & Verification
```bash
npx truffle compile
```

### 2.3 Comprehensive Automated Testing
Execute all 49 smart contract unit & integration tests covering custody state machines, access controls, price-cap math, and multi-signature releases:
```bash
npm test
```

### 2.4 Deployment & Contract Synchronization
Deploy contracts to local Ganache and automatically sync deployed addresses and ABIs to both `olive_backend` and `olive_web`:
```bash
npm run migrate
```

*What `npm run migrate` executes under the hood:*
1. Runs `truffle migrate --reset --network development`.
2. Triggers `scripts/sync-contracts.mjs`.
3. Emits `deployments.json` with contract addresses and complete ABIs into:
   - `olive_blockchain/build/deployments.json`
   - `olive_backend/src/contracts/deployments.json`
   - `olive_web/src/contracts/deployments.json`

### 2.5 Automated E2E Supply Chain Simulation (Optional)
Run an automated script that drives a complete olive oil lot from harvest to retail purchase:
```bash
npm run demo
```

---

## 3. Backend Oracle & Off-Chain Service (`olive_backend`)

The backend microservice manages laboratory off-chain telemetry, verifies Keccak-256 cryptographic hashes against the chain, and exposes an aggregated indexing API.

### 3.1 Installation & Configuration
```bash
cd olive_backend
npm install
```

Environment variables (default configured in `src/server.js`):
- `PORT`: `4000`
- `RPC_URL`: `http://127.0.0.1:7545`

### 3.2 Starting the Service
```bash
npm start
# Server listens at http://localhost:4000
```

### 3.3 Backend Test Suite
```bash
npm test
```

---

## 4. Frontend Web Application (`olive_web`)

The frontend is built with Next.js 16 App Router, Tailwind CSS, TypeScript, and Ethers.js v6.

### 4.1 Installation
```bash
cd olive_web
npm install
```

### 4.2 Development Server
```bash
npm run dev
# Open http://localhost:3000 in your browser
```

### 4.3 Production Build Check
```bash
npm run build
```

---

## 5. Connecting MetaMask to Local Ganache

1. Open your MetaMask browser extension.
2. Click **Add Network** -> **Add a network manually**:
   - **Network Name**: `Ganache Local`
   - **New RPC URL**: `http://127.0.0.1:7545`
   - **Chain ID**: `1337`
   - **Currency Symbol**: `ETH`
3. Import the private keys of the first 6 Ganache accounts:
   - **Account 0**: Deployer & Market Authority
   - **Account 1**: Farmer (Producer)
   - **Account 2**: Mill Operator (Extractor)
   - **Account 3**: Quality Inspector (Accredited Lab)
   - **Account 4**: Bottler / Distributor
   - **Account 5**: Grocery Retailer (Buyer)
4. Or simply navigate to `http://localhost:3000/journey` or `http://localhost:3000/people` and use the built-in account switcher and automatic network registration button.
