"use client";

import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { ACTOR_NAME, ROLE_TEXT, STEP_TEXT } from "@/features/journey/content";
import { ACTOR_OF, REQUIRED } from "@/features/journey/logic";
import { ROLE_KEYS, ROLE_NAME, useRoleAddresses } from "@/lib/roles";

const H2 = "mb-4 text-2xl font-bold tracking-tight";

export function GuideView() {
  const roles = useRoleAddresses();
  return (
    <div className="mx-auto max-w-[1100px] px-5 pb-16 md:px-8">
      <h1 className="py-8 text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-none tracking-tighter text-deep">Guide</h1>
      <p className="max-w-2xl text-lg text-muted">
        OliveChain follows one batch of olive oil from the farmer to the grocery. Every step is a blockchain transaction that you sign in
        MetaMask. Setup takes about five minutes. The demo takes about ten.
      </p>
      <div className="mt-6">
        <Link href="/journey" className="btn btn-light">Start the guided demo</Link>
      </div>

      <section aria-labelledby="setup" className="mt-14">
        <h2 id="setup" className={H2}>1. Set up once</h2>
        <ol className="grid list-decimal gap-3 pl-6 marker:font-bold marker:text-olive">
          <li className="pl-2">Start Ganache (GUI) with RPC server <span className="font-mono">127.0.0.1:7545</span> and network ID <span className="font-mono">5777</span>.</li>
          <li className="pl-2">
            Deploy the contracts: in <span className="font-mono">olive_blockchain</span> run <span className="font-mono">npm run migrate</span>. This also grants the inspector role and gives OLV to the demo accounts.
          </li>
          <li className="pl-2">
            Start the app: in <span className="font-mono">olive_web</span> run <span className="font-mono">npm run dev</span>, then open <span className="font-mono">localhost:3000</span>. The backend (<span className="font-mono">olive_backend</span>, <span className="font-mono">npm start</span>) is optional and stores the detailed quality records.
          </li>
          <li className="pl-2">
            Install MetaMask. Click <b>Connect MetaMask</b> at the top right and approve adding the OliveChain network (chain ID 1337).
          </li>
          <li className="pl-2">
            Import the six accounts below. In Ganache, click the key icon next to an account and copy its private key. In MetaMask, choose <b>Add account</b>, then <b>Import account</b>. Name each account with its role.
          </li>
        </ol>
      </section>

      <section aria-labelledby="accounts" className="mt-14">
        <h2 id="accounts" className={H2}>2. The six accounts</h2>
        <p className="mb-4 text-muted">No MetaMask yet? Open the <Link href="/people" className="font-bold underline underline-offset-4">People page</Link> and act as any of these accounts. That is for testing only. The top bar always shows who you are acting as.</p>
        {roles.error && <p role="alert" className="text-bad">Cannot read the accounts from Ganache: {roles.error}</p>}
        {!roles.data && !roles.error && <p className="text-muted">Reading the accounts from Ganache…</p>}
        <ul className="grid gap-3 md:grid-cols-2">
          {ROLE_KEYS.map((k) => (
            <li key={k} className="bg-surface p-5">
              <p className="text-xl font-bold">{ROLE_NAME[k]}</p>
              <p className="mt-1 text-muted">{ROLE_TEXT[k]}</p>
              {roles.data && (
                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="break-all font-mono text-sm">{roles.data[k]}</span>
                  <CopyButton value={roles.data[k]} />
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="steps" className="mt-14">
        <h2 id="steps" className={H2}>3. The eight steps</h2>
        <p className="mb-4 text-muted">The guided demo runs these in order and checks the chain after each one, so you always see where you are.</p>
        <ol className="grid gap-2">
          {REQUIRED.map((id, i) => (
            <li key={id} className="grid gap-1 bg-surface p-4 sm:grid-cols-[3rem_minmax(0,1fr)]">
              <span aria-hidden className="text-2xl font-extrabold text-olive">{i + 1}</span>
              <div>
                <p className="font-bold">{STEP_TEXT[id].title} <span className="font-normal text-muted">· {ACTOR_NAME[ACTOR_OF[id]]}</span></p>
                <p className="text-muted">{STEP_TEXT[id].what}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="fail" className="mt-14">
        <h2 id="fail" className={H2}>4. Three things that must fail</h2>
        <ul className="grid gap-2">
          <li className="bg-surface p-4"><b>A price above the cap.</b> The optional step &ldquo;Try an unfair price&rdquo; shows the escrow refusing it.</li>
          <li className="bg-surface p-4"><b>Release before certification.</b> The contract refuses it, and the demo keeps the button disabled until the batch is certified.</li>
          <li className="bg-surface p-4"><b>Release before custody moves.</b> The contract refuses it until the grocery holds the batch.</li>
        </ul>
      </section>

      <section aria-labelledby="trouble" className="mt-14">
        <h2 id="trouble" className={H2}>5. When something looks wrong</h2>
        <dl className="grid gap-3">
          <div className="bg-surface p-4"><dt className="font-bold">The page says the contracts are not deployed</dt><dd className="text-muted">Run <span className="font-mono">npm run migrate</span> in olive_blockchain, then refresh.</dd></div>
          <div className="bg-surface p-4"><dt className="font-bold">A step says &ldquo;Switch MetaMask&rdquo;</dt><dd className="text-muted">That step needs a different account. In MetaMask, open the account menu and choose the one it names.</dd></div>
          <div className="bg-surface p-4"><dt className="font-bold">&ldquo;Nonce too high&rdquo; after restarting Ganache</dt><dd className="text-muted">In MetaMask: Settings, Advanced, Clear activity tab data. Then run npm run migrate and refresh.</dd></div>
          <div className="bg-surface p-4"><dt className="font-bold">&ldquo;Transaction rejected in MetaMask&rdquo;</dt><dd className="text-muted">You pressed Reject. Press the step&rsquo;s button again to retry.</dd></div>
          <div className="bg-surface p-4"><dt className="font-bold">Start over with an empty chain</dt><dd className="text-muted">Restart Ganache, run npm run migrate, and refresh. The registry starts empty and the guided demo begins at step 1.</dd></div>
        </dl>
      </section>
    </div>
  );
}
