import { keccak256, toUtf8Bytes } from "ethers";

const FIELDS = { batchId: "number", acidity: "number", polyphenols: "number", location: "string", timestamp: "number" };

/** Validates a checkpoint record and returns it with only the known fields, or null. */
export function normalizeRecord(input) {
  if (!input || typeof input !== "object") return null;
  const out = {};
  for (const [key, type] of Object.entries(FIELDS)) {
    const v = input[key];
    if (typeof v !== type || (type === "number" && !Number.isFinite(v))) return null;
    if (type === "string" && (v.length === 0 || v.length > 200)) return null;
    out[key] = v;
  }
  return out;
}

/** keccak256 of the JSON with keys sorted alphabetically. The web app computes the same hash. */
export function hashRecord(record) {
  const sorted = Object.fromEntries(Object.keys(record).sort().map((k) => [k, record[k]]));
  return keccak256(toUtf8Bytes(JSON.stringify(sorted)));
}
