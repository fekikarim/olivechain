import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createApp } from "./app.js";
import { createChain } from "./chain.js";
import { createStore } from "./store.js";

const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 4000);

const chain = createChain({
  rpcUrl: process.env.RPC_URL ?? "http://127.0.0.1:7545",
  deploymentsFile: join(here, "contracts/deployments.json"),
});
const store = createStore(join(here, "../data/records.json"));
const app = createApp({ chain, store, webOrigin: process.env.WEB_ORIGIN });

app.listen(port, () => console.log(`OliveChain backend on http://localhost:${port}`));
