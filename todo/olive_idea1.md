# OliveChain Mini — Olive Oil Chain of Custody + Price-Cap Escrow

A mini version of OliveChain focused only on blockchain and smart contracts. Two developers, two independent contracts, one NFT and one FT, linked through a clean interface.

## 1. Goal

Track olive oil batches through a supply chain (farmer → olive mill → bottler / distributor → grocery retailer), certify their quality at each step, and ensure the price cannot keep rising unchecked along the chain.

The chain reflects a real Tunisian or Mediterranean olive oil supply journey:
- the **farmer** harvests olives and declares the initial lot price;
- the **mill operator** cold-presses the olives and records the extraction;
- the **quality inspector** (a certified lab or agronomist) tests acidity and polyphenols and validates the batch;
- the **distributor / bottler** packages and lists the oil for sale;
- the **grocery retailer** buys the lot through the escrow.

## 2. Team Split

| | Person A | Person B |
|---|---|---|
| Token type | NFT (ERC-721) | FT (ERC-20) |
| Contract | `BatchRegistry` | `OliveCoin` + `PriceCapEscrow` |
| Source of truth for | Physical reality: who holds the batch, was it certified, last declared price | Money and rules: OLV balances, escrow, max markup |
| Admins | Quality inspectors, regulators | Market authority |

## 3. Person A — `BatchRegistry` (NFT)

Each real-world olive oil lot (a harvest batch, an extraction run, a bottled lot) is one NFT.

**Stores**
- Batch metadata reference (variety, origin farm, harvest date, quantity in litres, off-chain URI or hash)
- Current custodian
- Append-only list of checkpoints (weight of olives, acidity %, polyphenols mg/kg, extraction temperature, location hash, timestamp, inspector)
- Certification flag (`isCertified`)
- Last declared price (append-only price history)

**Functions**
- `mintBatch(to, metadataURI, initialPrice)` — farmer registers the olive lot
- `transferCustody(batchId, newCustodian)` — physical handover (farm → mill → bottler → grocery)
- `addCheckpoint(batchId, dataHash)` — inspector records a quality measurement
- `certifyBatch(batchId)` — inspector only; marks the batch as certified extra-virgin / virgin
- `recordSalePrice(batchId, price)` — callable only by the escrow contract
- `getLastPrice(batchId)` — view
- `isCertified(batchId)` — view
- `custodianOf(batchId)` — view

**Roles**
- `owner / regulator`: manages inspectors and the authorized escrow address
- `inspector`: adds quality checkpoints and certifies batches
- `custodian`: transfers physical custody of the lot

**Events**
- `BatchMinted`, `CustodyTransferred`, `CheckpointAdded`, `BatchCertified`, `PriceRecorded`

## 4. Person B — `OliveCoin` + `PriceCapEscrow` (FT)

**OliveCoin (ERC-20)**
- Standard fungible payment token (`OLV`)
- Minted by the market authority for the demo (represents local currency or a commodity token)

**PriceCapEscrow**
- Holds buyer OLV payment until delivery conditions are met
- Enforces: `salePrice <= lastDeclaredPrice * (100 + maxMarkupPercent) / 100`
- Prevents price speculation at each handover in the supply chain

**Functions**
- `createSale(batchId, price)` — seller; reverts if price exceeds the cap
- `deposit(saleId)` — buyer locks OLV in escrow
- `releasePayment(saleId)` — requires `isCertified` true and custody moved to buyer
- `refund(saleId)` — buyer, if conditions are not met or the sale is cancelled
- `setMaxMarkup(percent)` — market authority only

**Events**
- `SaleCreated`, `Deposited`, `PaymentReleased`, `Refunded`, `MarkupChanged`

## 5. How the Two Contracts Talk

```
PriceCapEscrow  ──reads──▶  IBatchRegistry.getLastPrice(batchId)
PriceCapEscrow  ──reads──▶  IBatchRegistry.isCertified(batchId)
PriceCapEscrow  ──reads──▶  IBatchRegistry.custodianOf(batchId)
PriceCapEscrow  ──writes─▶  IBatchRegistry.recordSalePrice(batchId, price)
```

The registry never calls the escrow. The escrow depends on the registry through an interface only.

## 6. Why They Cannot Be Merged

- A knows the physical olive oil world: who holds the cans, whether the acidity was tested, the last farm price. It has no balances or money logic.
- B knows money and market rules: OLV balances, escrow locks, markup limits. It knows nothing about farms, mills or certifications.
- Different admins, different state, different reasons to change.
- B cannot work without A's `isCertified`, `getLastPrice` and `custodianOf`. A cannot enforce price control without B. Removing either one removes a whole function of the system.

## 7. Sale Lifecycle

1. Farmer mints a batch NFT for 500 kg of Chemlali olives with an initial price of 200 OLV.
2. Mill operator receives custody; inspector adds a cold-press checkpoint (acidity 0.3%, polyphenols 320 mg/kg).
3. Inspector certifies the batch as Extra Virgin.
4. Distributor lists the sale at 300 OLV. **Escrow rejects it** (cap is 240 OLV with 20% markup).
5. Distributor lists at 230 OLV. Accepted.
6. Grocery retailer deposits 230 OLV into escrow.
7. Custody moves to the grocery retailer and certification is confirmed. Payment is released to the distributor.
8. Registry records 230 OLV as the new last price.

## 8. Demo Scenarios

- Happy path: mint olive lot → certify → sale within cap → payment released
- Overpriced sale is rejected (distributor tries to set a price above the markup cap)
- Release blocked because the batch is not certified
- Release blocked because custody has not moved to the buyer
- Refund after a cancelled sale
- Unauthorized address cannot certify, add a checkpoint, or call `recordSalePrice`
- Price history is readable from events (trace the price from farm to shelf)

## 9. Tooling

- Solidity, Truffle (compile, migrate, test), Ganache (local chain), MetaMask (wallet)
- Sample assets only, clearly labelled as simulated (no real olive oil or payments)

## 10. Out of Scope

- Physical lab integration, real-world certifications (DOP/IGP), real payments
- Off-chain PDF certificates (documented as manual)
- Retail packaging tracking, barcode scanning
