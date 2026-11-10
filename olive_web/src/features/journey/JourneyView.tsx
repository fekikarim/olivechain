"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getContract } from "@/lib/contracts";
import { useLoad } from "@/lib/hooks";
import { useWallet } from "@/lib/wallet";
import { useRoleAddresses } from "@/lib/roles";
import { olv, same } from "@/lib/format";
import { ACTOR_NAME, STEP_TEXT } from "./content";
import { loadScenario, RESTART_EVENT, startDemoFrom, type Scenario } from "./data";
import { buildSteps, isComplete, prerequisite, REQUIRED, type Facts, type Status, type Step, type StepId } from "./logic";
import {
  CertifyStep, CompleteBox, DepositStep, HandStep, ListStep, MintStep, ReleaseStep, StepCard, TryUnfairStep,
} from "./steps";

const STATUS_TEXT: Record<Status, string> = { done: "Done", active: "Your turn", waiting: "Locked", optional: "Optional" };
const BADGE_CLASS: Record<Status, string> = {
  done: "bg-olive text-ground",
  active: "bg-oil text-deep",
  optional: "bg-surface-2 text-deep",
  waiting: "bg-surface-2 text-muted",
};

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[1280px] px-5 pb-16 md:px-8">
      <h1 className="py-8 text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-none tracking-tighter text-deep">Guided demo</h1>
      {children}
    </div>
  );
}

export function JourneyView() {
  const { account, onOliveChain, actAs } = useWallet();
  const roles = useRoleAddresses();
  const addr = roles.data;
  const scenario = useLoad<Scenario | null>(async () => (addr ? loadScenario(account) : null), [account, addr]);
  const [picked, setPicked] = useState<StepId | null>(null);
  useEffect(() => {
    const onRestart = () => { setPicked(null); scenario.reload(); };
    window.addEventListener(RESTART_EVENT, onRestart);
    return () => window.removeEventListener(RESTART_EVENT, onRestart);
  }, [scenario.reload]);
  const s = scenario.data;

  if (!getContract("BatchRegistry")) {
    return (
      <Shell>
        <p className="bg-surface p-6">The contracts are not deployed yet. In olive_blockchain run <code>npm run migrate</code>, then refresh.</p>
      </Shell>
    );
  }
  if (roles.error) {
    return (
      <Shell>
        <p role="alert" className="bg-surface p-6 text-bad">
          Cannot read the demo accounts from Ganache ({roles.error}). Is Ganache running on 127.0.0.1:7545?
        </p>
      </Shell>
    );
  }
  if (!addr || !s) {
    return (
      <Shell>
        {scenario.error ? <p role="alert" className="text-bad">{scenario.error}</p> : <p className="text-muted">Loading the scenario from Ganache…</p>}
      </Shell>
    );
  }

  const activeSale = s.market?.sales.find((x) => x.batchId === s.id && x.state !== "Cancelled") ?? null;
  const facts: Facts = {
    hasBatch: !!s.batch,
    custodian: s.batch?.custodian ?? null,
    certified: !!s.batch?.certified,
    sale: activeSale ? { state: activeSale.state } : null,
    addr: { farmer: addr.farmer, mill: addr.mill, distributor: addr.distributor, grocery: addr.grocery },
  };
  const steps = buildSteps(facts);
  const doneCount = REQUIRED.filter((id) => steps.some((x) => x.id === id && x.status === "done")).length;
  const complete = isComplete(facts);
  const activeId = steps.find((x) => x.status === "active")?.id ?? null;
  const shownId = picked ?? activeId;
  const shown = steps.find((x) => x.id === shownId) ?? null;
  const hasCheckpoint = s.history.some((h) => h.event === "CheckpointAdded");
  const reload = () => scenario.reload();
  const startOver = () => {
    if (!s) return;
    startDemoFrom(s.total);
    setPicked(null);
  };
  const afterMint = async () => {
    setPicked(null);
    await scenario.reload();
  };

  const notice = !account
    ? "Connect MetaMask (top right) to begin. Each step tells you which account to choose."
    : !onOliveChain
      ? "Your wallet is on another network. Use the top-right button to switch to OliveChain."
      : null;

  const actionFor = (id: StepId): ReactNode => {
    switch (id) {
      case "mint":
        return <MintStep account={addr.farmer} onDone={afterMint} />;
      case "toMill":
        return <HandStep batchId={s.id} to={addr.mill} toName="Mill operator" onDone={reload} />;
      case "certify":
        return <CertifyStep batchId={s.id} hasCheckpoint={hasCheckpoint} onDone={reload} />;
      case "toDist":
        return <HandStep batchId={s.id} to={addr.distributor} toName="Distributor" onDone={reload} />;
      case "tryUnfair":
        return <TryUnfairStep batchId={s.id} onDone={reload} />;
      case "list":
        return s.batch ? <ListStep batchId={s.id} lastPrice={s.batch.lastPrice} onDone={reload} /> : null;
      case "deposit":
        return activeSale && s.market ? (
          <DepositStep sale={activeSale} balance={s.market.balance} allowance={s.market.allowance} escrow={s.market.escrowAddress} onDone={reload} />
        ) : null;
      case "toGrocery":
        return <HandStep batchId={s.id} to={addr.grocery} toName="Grocery" onDone={reload} />;
      case "release":
        return activeSale ? (
          <ReleaseStep
            sale={activeSale}
            certified={!!s.batch?.certified}
            custodyWithBuyer={same(s.batch?.custodian, activeSale.buyer)}
            onDone={reload}
          />
        ) : null;
    }
  };

  const renderStep = (st: Step) => {
    const info = STEP_TEXT[st.id];
    const address = st.actor === "anyone" ? null : addr[st.actor];
    const canAct = !!account && onOliveChain && (st.actor === "anyone" || same(account, address));
    const prev = prerequisite(st.id);
    return (
      <StepCard
        key={st.id}
        title={info.title}
        what={info.what}
        expect={info.expect}
        who={ACTOR_NAME[st.actor]}
        address={address}
        account={account}
        onOliveChain={onOliveChain}
        canAct={canAct}
        status={st.status}
        lockedBy={prev ? STEP_TEXT[prev].title : undefined}
        onActAs={address ? () => actAs(address, ACTOR_NAME[st.actor]) : undefined}
      >
        {actionFor(st.id)}
      </StepCard>
    );
  };

  return (
    <div className="mx-auto max-w-[1280px] px-5 pb-16 md:px-8">
      <header className="py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-none tracking-tighter text-deep">Guided demo</h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">
              Follow the steps from farm to shelf. Each step names the MetaMask account to use and what you should see. Progress is read from
              the blockchain, so you can leave the page and come back.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-quiet" onClick={reload}>Refresh</button>
            <button type="button" className="btn" onClick={startOver}>Start from step 1</button>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <div
            role="progressbar"
            aria-label="Demo progress"
            aria-valuemin={0}
            aria-valuemax={REQUIRED.length}
            aria-valuenow={doneCount}
            className="h-3 flex-1 bg-surface-2"
          >
            <div className="h-full bg-olive transition-[width] duration-500" style={{ width: `${(doneCount / REQUIRED.length) * 100}%` }} />
          </div>
          <p className="shrink-0 font-semibold">{doneCount} of {REQUIRED.length} steps done</p>
        </div>
      </header>

      {notice && <p role="status" className="mb-6 bg-oil p-4 font-semibold text-deep">{notice}</p>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]">
        <nav aria-label="Demo steps">
          <ol className="grid gap-2">
            {steps.map((st) => {
              const isCurrent = st.id === shownId;
              const number = REQUIRED.indexOf(st.id) + 1;
              const badge = st.status === "done" ? "✓" : st.status === "optional" ? "+" : st.required ? String(number) : "·";
              return (
                <li key={st.id}>
                  <button
                    type="button"
                    onClick={() => setPicked(st.id)}
                    aria-current={isCurrent ? "step" : undefined}
                    className={`flex w-full items-center gap-3 p-3 text-left transition-colors ${
                      isCurrent ? "bg-deep text-ground" : "bg-surface hover:bg-surface-2"
                    } ${st.status === "waiting" ? "opacity-75" : ""}`}
                  >
                    <span aria-hidden className={`grid h-8 w-8 shrink-0 place-items-center font-bold ${BADGE_CLASS[st.status]}`}>{badge}</span>
                    <span className="min-w-0">
                      <span className="block font-bold leading-snug">{STEP_TEXT[st.id].title}</span>
                      <span className="block text-sm opacity-80">{ACTOR_NAME[st.actor]} · {STATUS_TEXT[st.status]}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="grid content-start gap-4">
          {shown ? (
            renderStep(shown)
          ) : (
            <>
              <CompleteBox batchId={s.id} price={activeSale?.price ?? null} />
              {renderStep({ id: "mint", actor: "farmer", required: true, status: "active" })}
            </>
          )}
          {complete && shown && <p className="text-muted">Batch #{s.id} is complete. Pick any step to review it.</p>}
        </div>
      </div>
    </div>
  );
}
