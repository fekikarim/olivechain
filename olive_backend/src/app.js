import express from "express";
import cors from "cors";
import { isAddress } from "ethers";
import { hashRecord, normalizeRecord } from "./records.js";

const STATES = ["None", "Created", "Deposited", "Released", "Refunded", "Cancelled"];
const REGISTRY_EVENTS = ["BatchMinted", "CustodyTransferred", "CheckpointAdded", "BatchCertified", "PriceRecorded"];

/** Recursively turns bigint into string so it can be sent as JSON. */
const plain = (v) =>
  JSON.parse(JSON.stringify(v, (_, x) => (typeof x === "bigint" ? x.toString() : x)));

export function createApp({ chain, store, webOrigin = "http://localhost:3000" }) {
  const app = express();
  app.use(cors({ origin: webOrigin }));
  app.use(express.json({ limit: "10kb" }));

  const wrap = (fn) => (req, res) => fn(req, res).catch((e) => res.status(502).json({ error: e.shortMessage ?? e.message }));
  const needs = (name) => (req, res, next) =>
    chain[name] ? next() : res.status(503).json({ error: `${name} not deployed: run npm run migrate in olive_blockchain` });
  const positiveInt = (s) => (/^\d+$/.test(s) && Number(s) > 0 ? BigInt(s) : null);

  async function batchSummary(id) {
    const [custodian, certified, lastPrice, uri] = await Promise.all([
      chain.registry.custodianOf(id),
      chain.registry.isCertified(id),
      chain.registry.getLastPrice(id),
      chain.registry.tokenURI(id),
    ]);
    return { id: id.toString(), custodian, certified, lastPrice: lastPrice.toString(), uri };
  }

  app.get("/api/health", wrap(async (_req, res) => {
    const [network, block] = await Promise.all([chain.provider.getNetwork(), chain.provider.getBlockNumber()]);
    res.json({ ok: true, chainId: network.chainId.toString(), block, contracts: chain.addresses });
  }));

  app.get("/api/batches", needs("registry"), wrap(async (_req, res) => {
    const total = Number(await chain.registry.totalBatches());
    const ids = Array.from({ length: total }, (_, i) => BigInt(total - i)); // newest first
    res.json(await Promise.all(ids.map(batchSummary)));
  }));

  app.get("/api/batches/:id", needs("registry"), wrap(async (req, res) => {
    const id = positiveInt(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid batch id" });
    const total = await chain.registry.totalBatches();
    if (id > total) return res.status(404).json({ error: "batch not found" });
    const [summary, ...logs] = await Promise.all([
      batchSummary(id),
      ...REGISTRY_EVENTS.map((n) => chain.registry.queryFilter(chain.registry.filters[n](id), 0)),
    ]);
    const history = logs
      .flat()
      .sort((a, b) => a.blockNumber - b.blockNumber || a.index - b.index)
      .map((l) => {
        const args = plain(Object.fromEntries(l.fragment.inputs.map((inp, i) => [inp.name, l.args[i]])));
        const entry = { event: l.fragment.name, block: l.blockNumber, tx: l.transactionHash, args };
        if (l.fragment.name === "CheckpointAdded") entry.record = store.get(args.dataHash);
        return entry;
      });
    res.json({ ...summary, history });
  }));

  app.get("/api/sales", needs("escrow"), wrap(async (_req, res) => {
    const total = Number(await chain.escrow.saleCount());
    const sales = await Promise.all(Array.from({ length: total }, (_, i) => chain.escrow.getSale(total - i).then((s) => ({ id: String(total - i), s }))));
    res.json(sales.map(({ id, s }) => ({ id, seller: s.seller, buyer: s.buyer, batchId: s.batchId.toString(), price: s.price.toString(), state: STATES[Number(s.state)] })));
  }));

  app.get("/api/balances/:address", needs("coin"), wrap(async (req, res) => {
    if (!isAddress(req.params.address)) return res.status(400).json({ error: "invalid address" });
    res.json({ address: req.params.address, balance: (await chain.coin.balanceOf(req.params.address)).toString(), symbol: "OLV" });
  }));

  // Off-chain checkpoint records. The hash is what the inspector anchors on-chain with addCheckpoint.
  app.post("/api/records", (req, res) => {
    const record = normalizeRecord(req.body);
    if (!record) return res.status(400).json({ error: "invalid record" });
    const hash = hashRecord(record);
    store.put(hash, record);
    res.status(201).json({ hash });
  });

  app.get("/api/records/:hash", wrap(async (req, res) => {
    const record = store.get(req.params.hash);
    if (!record) return res.status(404).json({ error: "record not found" });
    let anchored = false;
    if (chain.registry) {
      const logs = await chain.registry.queryFilter(chain.registry.filters.CheckpointAdded(record.batchId), 0);
      anchored = logs.some((l) => l.args.dataHash === req.params.hash);
    }
    res.json({ hash: req.params.hash, record, anchored });
  }));

  return app;
}
