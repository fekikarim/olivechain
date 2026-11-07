import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";

/** Tiny JSON-file store for off-chain checkpoint records, keyed by hash. */
export function createStore(file) {
  const load = () => (existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {});
  return {
    get: (hash) => load()[hash] ?? null,
    all: () => load(),
    put(hash, record) {
      const data = load();
      data[hash] = record;
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, JSON.stringify(data, null, 2));
    },
  };
}
