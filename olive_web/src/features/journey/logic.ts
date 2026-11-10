// Pure rules for the guided demo. No imports, so it runs under plain Node for checks.

export type StepId = "mint" | "toMill" | "certify" | "toDist" | "tryUnfair" | "list" | "deposit" | "toGrocery" | "release";
export type Actor = "farmer" | "mill" | "inspector" | "distributor" | "grocery" | "anyone";
export type Holder = "farmer" | "mill" | "distributor" | "grocery";
export type Status = "done" | "active" | "waiting" | "optional";

export const REQUIRED: StepId[] = ["mint", "toMill", "certify", "toDist", "list", "deposit", "toGrocery", "release"];

export const ACTOR_OF: Record<StepId, Actor> = {
  mint: "farmer",
  toMill: "farmer",
  certify: "inspector",
  toDist: "mill",
  tryUnfair: "distributor",
  list: "distributor",
  deposit: "grocery",
  toGrocery: "distributor",
  release: "anyone",
};

export type Facts = {
  hasBatch: boolean;
  custodian: string | null;
  certified: boolean;
  sale: { state: string } | null; // latest sale of this batch that is not cancelled
  addr: Record<Holder, string>;
};

export type Step = { id: StepId; actor: Actor; required: boolean; status: Status };

const same = (a: string | null | undefined, b: string | null | undefined) =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase();

/** A step is done when the chain shows its result. Facts only move forward, so done steps stay done. */
export function doneSteps(f: Facts): Record<StepId, boolean> {
  const sale = f.sale?.state;
  const atGrocery = same(f.custodian, f.addr.grocery);
  return {
    mint: f.hasBatch,
    toMill: f.hasBatch && !same(f.custodian, f.addr.farmer),
    certify: f.certified,
    toDist: same(f.custodian, f.addr.distributor) || atGrocery || !!f.sale,
    tryUnfair: false, // optional: never gates anything; its result is shown in its own card
    list: !!f.sale,
    deposit: sale === "Deposited" || sale === "Released",
    toGrocery: atGrocery,
    release: sale === "Released",
  };
}

export function buildSteps(f: Facts): Step[] {
  const done = doneSteps(f);
  const active = REQUIRED.find((id) => !done[id]);
  const steps: Step[] = [];
  for (const id of REQUIRED) {
    const status: Status = done[id] ? "done" : id === active ? "active" : "waiting";
    steps.push({ id, actor: ACTOR_OF[id], required: true, status });
    if (id === "toDist") {
      steps.push({ id: "tryUnfair", actor: ACTOR_OF.tryUnfair, required: false, status: done.toDist ? "optional" : "waiting" });
    }
  }
  return steps;
}

export function prerequisite(id: StepId): StepId | null {
  if (id === "tryUnfair") return "toDist";
  const i = REQUIRED.indexOf(id);
  return i > 0 ? REQUIRED[i - 1] : null;
}

export const isComplete = (f: Facts) => doneSteps(f).release;
