# Manual Test — Person A (BatchRegistry)

Step-by-step checks for everything Person A delivered (A00–A15): the contract, the migration and the
`/registry` UI with MetaMask. Tick each box as you go. All assets are simulated.

Tasks not covered here: A02 / A09b (wait for Person B's interface review) and A16 / A17 (wait for B's escrow).

---

## 0. Setup (once)

### 0.1 Ganache
- [ ] Ganache GUI is running with RPC `127.0.0.1:7545`, network ID `5777` (see [configuration.md](olive_blockchain/configuration.md))

### 0.2 MetaMask accounts
Import these Ganache accounts into MetaMask (Ganache → 🔑 key icon → copy private key → MetaMask → **Import account**).
Rename each one in MetaMask so you can tell them apart:

| MetaMask name | Ganache account | Role in the tests |
|---------------|-----------------|-------------------|
| **Regulator** | index 0 (first) | Deploys the registry, so it's the contract owner |
| **Inspector** | index 1 | Quality certifier; will be granted the inspector role |
| **Farmer** | index 2 | Harvests olives and mints batches |
| **Mill Operator** | index 3 | Receives custody; cold-presses the olives into oil |

- [ ] All four accounts imported, on the **OliveChain** network (chain ID 1337), each with ETH

> Copy each address from Ganache now. You'll paste them into the UI forms.

### 0.3 Deploy and start the app
```bash
cd olive_blockchain && npm install
```
```bash
npm run migrate
```
```bash
cd ../olive_web && npm install && npm run dev
```

- [ ] `npm run migrate` prints `Deploying 'BatchRegistry'` and `[sync-contracts] network 5777: BatchRegistry`
- [ ] http://localhost:3000 opens

> `npm run migrate` deploys a **new, empty** registry each time. Run it again whenever you want a clean start.
> If MetaMask later shows `nonce too high` (after a Ganache restart), use MetaMask → Settings → Advanced → **Clear activity tab data**.

---

## 1. Automated tests (A03–A10)

```bash
cd olive_blockchain && npm test
```
- [ ] **41 passing**, 0 failing

```bash
npm run test:gas
```
- [ ] Gas table prints. `mintBatch` is about 138k gas, and every other method is under 60k

```bash
truffle compile --all
```
- [ ] Compiles with **no warnings**

---

## 2. Connection status (A00, A11)

Open http://localhost:3000 with MetaMask on **Regulator**.

- [ ] ✅ Ganache RPC `http://127.0.0.1:7545`, with a block number
- [ ] ✅ MetaMask installed
- [ ] ✅ Wallet connected (click **Connect MetaMask** in the header if needed)
- [ ] ✅ Network chain ID 1337
- [ ] ✅ BatchRegistry deployed, showing an address
- [ ] OliveCoin / PriceCapEscrow show "not migrated yet" (B's part, expected)
- [ ] Switch MetaMask to another network: the header button changes to **Switch to OliveChain (Ganache)**, and clicking it switches back

---

## 3. Regulator panel (A04, A15)

Go to **Batches** (`/registry`) as **Regulator**.

- [ ] A **regulator** badge shows next to the "Batches" title
- [ ] The 🏛️ Regulator card has no orange warning

**Grant the inspector role**
1. Paste the **Inspector** address in *Inspector address*
- [ ] It shows "Currently: not an inspector"
2. Click **Grant** and confirm in MetaMask
- [ ] It changes to "Currently: inspector ✓"

**Revoke and grant again**
3. Click **Revoke** and confirm
- [ ] "Currently: not an inspector"
4. Click **Grant** again and confirm (needed for the next sections)
- [ ] "Currently: inspector ✓"

**Escrow**
- [ ] *Escrow* shows `0x0000…0000` (none set yet)
5. Enter `0x0000000000000000000000000000000000000000` in *New escrow address* → **Set escrow**
- [ ] Red error: `Reverted: ZeroAddress()`

**Non-regulator is rejected**
6. Switch MetaMask to **Farmer**
- [ ] The Regulator card shows "You are not the regulator: the contract will reject these actions."
7. Enter any address → **Grant** → confirm
- [ ] Red error: `Reverted: OwnableUnauthorizedAccount(<Farmer address>)`

---

## 4. Mint a batch (A05, A12, A13)

Stay on **Farmer**.

1. In *Mint a batch*: the first custodian is prefilled with the Farmer address. Enter metadata `ipfs://olivechain/chemlali-lot-01` and price `200`
2. Click **Mint batch** and confirm in MetaMask
- [ ] Batch **#1** appears in the list: Farmer as custodian, "not certified", `200.0 OLV`
- [ ] The detail panel opens with Custodian = Farmer, Last price `200.0 OLV`, Metadata = your URI
- [ ] History shows **🌱 Minted** (farmer = Farmer) and **💰 Price recorded** `200.0 OLV`

**Input checks**
3. Set price to `0`
- [ ] The **Mint batch** button is disabled
4. Set price `10`, first custodian `0x0000000000000000000000000000000000000000` → **Mint batch**
- [ ] Red error: `Reverted: ERC721InvalidReceiver(0x0000…0000)`
5. Put the Farmer address back and mint a second batch: `ipfs://olivechain/arbequina-lot-02`, price `350`
- [ ] Batch **#2** appears at the top of the list

**MetaMask cancel**
6. Start another mint and click **Reject** in MetaMask
- [ ] Red message: `Transaction rejected in MetaMask.`

---

## 5. Inspector actions: rejected for non-inspectors (A07, A08, A14)

Stay on **Farmer** and click batch **#1**.

- [ ] *Add checkpoint* and *Certify batch* both show "You are not an inspector: the contract will reject this."
1. Fill acidity `0.3`, polyphenols `320`, location `Sfax` → **Add checkpoint** → confirm
- [ ] Red error: `Reverted: NotInspector()`
2. Click **Certify** → confirm
- [ ] Red error: `Reverted: NotInspector()`
- [ ] The batch is still "not certified"

---

## 6. Custody transfer (A06, A14)

Still on **Farmer**, batch **#1**.

- [ ] *Transfer custody* has **no** orange warning (Farmer is the custodian)
1. Paste the **Mill Operator** address → **Transfer** → confirm
- [ ] Custodian changes to Mill Operator, in both the detail panel and the list
- [ ] History adds **🚚 Custody transferred** `Farmer → Mill Operator`
- [ ] In MetaMask on **Mill Operator**, the NFTs tab can import the token (contract = BatchRegistry address, ID 1). Optional: the NFT represents physical custody of the olive oil lot.

**Non-custodian is rejected**
2. Still on Farmer, try to transfer batch **#1** again (Farmer no longer holds it)
- [ ] An orange warning shows "You are not the custodian…"
- [ ] After you confirm: `Reverted: ERC721IncorrectOwner(<Farmer>, 1, <MillOperator>)`

---

## 7. Checkpoints and certification by the inspector (A07, A08, A14)

Switch MetaMask to **Inspector**, then reload `/registry`.

- [ ] An **inspector** badge shows next to the title
1. Click batch **#1** → *Add checkpoint*: acidity `0.3`, polyphenols `320`, location `Sfax` → **Add checkpoint** → confirm
- [ ] Below the form: "Off-chain record (keep it)" with the JSON (acidity, polyphenols, location, timestamp), plus the on-chain `bytes32` hash
- [ ] History adds **📋 Checkpoint** with the Inspector address and the same hash
2. Click **Certify batch** → confirm
- [ ] The badge turns **✓ certified (Extra Virgin)**, in both the list and the detail
- [ ] History adds **✅ Certified** (inspector = Inspector)
- [ ] The *Certify batch* section disappears (certification happens only once per batch)
3. Batch **#2** is still "not certified" (certification is per batch)

**Certification survives custody moves**
4. Switch to **Mill Operator** → batch #1 → transfer custody back to the Farmer address
- [ ] Batch #1 is still **✓ certified**

---

## 8. Sale price recording (A09)

There's no UI for this, because only the escrow (Person B) calls `recordSalePrice`. Test it with a
**stand-in escrow** in the Truffle console:

```bash
cd olive_blockchain && truffle console --network development
```
```js
const r = await BatchRegistry.deployed()
const accounts = await web3.eth.getAccounts()
await r.setEscrow(accounts[4])                                            // regulator sets a fake escrow
await r.recordSalePrice(1, web3.utils.toWei("230"), { from: accounts[4] })
(await r.getLastPrice(1)).toString()                                     // '230000000000000000000'
await r.recordSalePrice(1, web3.utils.toWei("1"), { from: accounts[0] }) // must fail
```
- [ ] The first `recordSalePrice` succeeds, and `getLastPrice(1)` returns `230000000000000000000`
- [ ] The call from `accounts[0]` throws a revert (Truffle shows "Custom error (could not decode)", which is `NotEscrow()`)
- [ ] In the UI (reload `/registry`), batch #1 shows `230.0 OLV`, and History adds **💰 Price recorded** `230.0 OLV`
- [ ] The Regulator card's *Escrow* shows the `accounts[4]` address

Type `.exit` to leave the console. Person B's migration will later set the real escrow.

---

## 9. Idea §8 scenarios covered by Person A

| Scenario (olive_idea1.md §8) | Checked in |
|------------------------------|-----------|
| Unauthorized address cannot certify a batch | §5 step 2 |
| Unauthorized address cannot add a checkpoint | §5 step 1 |
| Unauthorized address cannot call `recordSalePrice` | §8 |
| Release blocked: not certified / custody not moved | ⛔ Needs B's escrow (A16) |
| Happy path, overpriced sale, refund | ⛔ Needs B's escrow (A16/A17) |
| Price history traceable from farm to shelf | §8 (UI) + integration (A16) |

---

## Result

- [ ] All boxes above ticked → Person A's part works end to end with MetaMask
- If something fails, note the section, step and exact error text in `olive_blockchain/roadmap-A.md` → *Current State → Open problems*
