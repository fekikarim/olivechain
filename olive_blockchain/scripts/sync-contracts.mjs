// Copies ABIs + addresses of the current Ganache deployment (network 5777)
// into olive_web and olive_backend as deployments.json.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NETWORK_ID = "5777";
const NAMES = ["BatchRegistry", "OliveCoin", "PriceCapEscrow"];
const targets = [
  join(root, "../olive_web/src/contracts"),
  join(root, "../olive_backend/src/contracts"),
];

const out = {};
for (const name of NAMES) {
  const file = join(root, "build/contracts", `${name}.json`);
  if (!existsSync(file)) continue;
  const art = JSON.parse(readFileSync(file, "utf8"));
  const net = art.networks?.[NETWORK_ID];
  if (net?.address) out[name] = { address: net.address, abi: art.abi };
}

for (const dir of targets) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "deployments.json"), JSON.stringify(out, null, 2));
}
console.log(`[sync-contracts] network ${NETWORK_ID}: ${Object.keys(out).join(", ") || "nothing deployed"}`);
