"use client";

import { useEffect } from "react";
import Link from "next/link";
import { getContract } from "@/lib/contracts";
import { useLoad } from "@/lib/hooks";
import { same } from "@/lib/format";
import { useWallet } from "@/lib/wallet";
import { labelOf, useAccounts, useRoleAddresses } from "@/lib/roles";
import { ACTOR_NAME, roleOfActor, STEP_TEXT } from "@/features/journey/content";
import { RoleAvatar } from "@/components/Icons";
import { factsFrom, loadScenario, RESTART_EVENT } from "@/features/journey/data";
import { buildSteps, isComplete, REQUIRED } from "@/features/journey/logic";

/** Always-visible bar: which demo step is next, who it is for, and who you are right now. */
export function DemoStatus() {
  const { account, onOliveChain, actAs } = useWallet();
  const accounts = useAccounts();
  const roles = useRoleAddresses();
  const addr = roles.data;
  const s = useLoad(async () => (addr ? loadScenario(account) : null), [account, addr]);
  const reload = s.reload;

  useEffect(() => {
    const t = setInterval(reload, 10000);
    window.addEventListener(RESTART_EVENT, reload);
    return () => {
      clearInterval(t);
      window.removeEventListener(RESTART_EVENT, reload);
    };
  }, [reload]);

  if (!getContract("BatchRegistry") || !addr || !s.data) return null;
  const facts = factsFrom(s.data, addr);
  const steps = buildSteps(facts);
  const you = account ? labelOf(account, accounts.data) : null;

  let body: React.ReactNode;
  if (isComplete(facts)) {
    body = <span className="font-bold">Demo complete for batch #{s.data.id}. Start another batch on the Guided demo page.</span>;
  } else {
    const active = steps.find((x) => x.status === "active");
    if (!active) return null;
    const actor = ACTOR_NAME[active.actor];
    const address = active.actor === "anyone" ? null : addr[active.actor];
    const canAct = !!account && onOliveChain && (active.actor === "anyone" || same(account, address));
    body = (
      <>
        <span className="font-bold text-oil">Step {REQUIRED.indexOf(active.id) + 1} of {REQUIRED.length}</span>
        <span className="font-semibold">{STEP_TEXT[active.id].title}</span>
        <span className="inline-flex items-center gap-2 text-ground/80">
          <RoleAvatar role={roleOfActor(active.actor)} size={26} />
          For: {active.actor === "anyone" ? "any account" : actor}
        </span>
        <span className="text-ground/80">You: {you ?? "nobody yet"}</span>
        {canAct ? (
          <span className="font-bold text-oil">You can do this now</span>
        ) : address ? (
          <button
            type="button"
            onClick={() => actAs(address, actor)}
            className="bg-oil px-3 py-1 font-bold text-deep transition-colors hover:bg-[#f0cd56]"
          >
            Act as {actor}
          </button>
        ) : null}
      </>
    );
  }

  return (
    <div className="bg-deep text-ground">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-5 gap-y-2 px-5 py-2.5 text-sm md:px-8">
        {body}
        <Link href="/journey" className="ml-auto font-bold underline underline-offset-4 hover:text-oil">Open guided demo</Link>
      </div>
    </div>
  );
}
