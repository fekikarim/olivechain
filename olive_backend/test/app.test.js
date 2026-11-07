import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "../src/app.js";
import { createChain } from "../src/chain.js";
import { createStore } from "../src/store.js";
import { hashRecord } from "../src/records.js";

const here = dirname(fileURLToPath(import.meta.url));
let server, base;

before(async () => {
  const chain = createChain({
    rpcUrl: "http://127.0.0.1:7545",
    deploymentsFile: join(here, "../src/contracts/deployments.json"),
  });
  const store = createStore(join(mkdtempSync(join(tmpdir(), "olive-")), "records.json"));
  server = createApp({ chain, store }).listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const get = (p) => fetch(base + p);
const post = (p, body) => fetch(base + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const record = { batchId: 1, acidity: 0.3, polyphenols: 320, location: "Sfax", timestamp: 1700000000 };

test("hash ignores key order", () => {
  const shuffled = { timestamp: record.timestamp, location: record.location, polyphenols: 320, batchId: 1, acidity: 0.3 };
  assert.equal(hashRecord(record), hashRecord(shuffled));
});

test("health reports chain 1337 and contracts", async () => {
  const body = await (await get("/api/health")).json();
  assert.equal(body.chainId, "1337");
  assert.ok(body.contracts.BatchRegistry);
});

test("records: store, fetch, reject invalid", async () => {
  const created = await post("/api/records", record);
  assert.equal(created.status, 201);
  const { hash } = await created.json();
  assert.equal(hash, hashRecord(record));
  const fetched = await (await get(`/api/records/${hash}`)).json();
  assert.deepEqual(fetched.record, record);
  assert.equal(fetched.anchored, false);
  assert.equal((await post("/api/records", { ...record, acidity: "x" })).status, 400);
  assert.equal((await get(`/api/records/0x${"0".repeat(64)}`)).status, 404);
});

test("batches list, detail validation and 404", async () => {
  const list = await (await get("/api/batches")).json();
  assert.ok(Array.isArray(list));
  assert.equal((await get("/api/batches/abc")).status, 400);
  assert.equal((await get("/api/batches/999999")).status, 404);
});

test("sales and balances", async () => {
  assert.ok(Array.isArray(await (await get("/api/sales")).json()));
  assert.equal((await get("/api/balances/nope")).status, 400);
  const rpc = await fetch("http://127.0.0.1:7545", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_accounts", params: [] }) });
  const accounts = (await rpc.json()).result;
  const bal = await (await get(`/api/balances/${accounts[1]}`)).json();
  assert.equal(bal.symbol, "OLV");
  assert.equal(bal.balance, "10000000000000000000000");
});
