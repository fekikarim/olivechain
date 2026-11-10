import type { Actor, StepId } from "./logic";
import type { RoleKey } from "@/lib/roles";

export const ACTOR_NAME: Record<Actor, string> = {
  farmer: "Farmer",
  mill: "Mill operator",
  inspector: "Inspector",
  distributor: "Distributor",
  grocery: "Grocery",
  anyone: "Any account",
};

export const STEP_TEXT: Record<StepId, { title: string; what: string; expect: string }> = {
  mint: {
    title: "Mint the olive batch",
    what: "The farmer registers a lot of olive oil. It becomes one NFT, and the farmer holds it at first.",
    expect: "A new batch appears in Registry with the declared price and the farmer as custodian.",
  },
  toMill: {
    title: "Hand the batch to the mill",
    what: "The farmer passes physical custody to the mill operator. The NFT moves with it.",
    expect: "The custodian changes to the mill operator, and a 'Custody transferred' entry appears in the history.",
  },
  certify: {
    title: "Inspect and certify",
    what: "The inspector records the quality measurements. Only a hash goes on-chain, and the backend keeps the full record. Then the inspector certifies the batch.",
    expect: "The batch shows 'Certified'. Certification happens once per batch.",
  },
  toDist: {
    title: "Hand the batch to the distributor",
    what: "The mill operator sends the certified lot to the distributor, who will bottle and sell it.",
    expect: "The distributor becomes the custodian, so only the distributor can now list the batch for sale.",
  },
  tryUnfair: {
    title: "Optional: try an unfair price",
    what: "The distributor tries to list the batch 10 OLV above the allowed cap. The escrow must refuse it.",
    expect: "A red message 'Price is above the markup cap'. Nothing is listed and no OLV moves.",
  },
  list: {
    title: "List the batch at a fair price",
    what: "The distributor puts the batch up for sale. The price may not be above the last price plus the allowed markup.",
    expect: "A sale appears in Market with the state 'Created'.",
  },
  deposit: {
    title: "The grocery deposits the payment",
    what: "The grocery approves the escrow to use its OLV, then deposits the price. The OLV stays locked until delivery.",
    expect: "The sale changes to 'Deposited'. MetaMask asks twice: first the approval, then the deposit.",
  },
  toGrocery: {
    title: "Hand the batch to the grocery",
    what: "The distributor passes custody of the batch to the grocery, which has paid.",
    expect: "The grocery becomes the custodian. The payment can now be released.",
  },
  release: {
    title: "Release the payment",
    what: "Once the batch is certified and held by the buyer, anyone can release the payment. The escrow pays the distributor and records the sale price on the registry.",
    expect: "The sale shows 'Released', the distributor received the OLV, and the batch's last price is the sale price.",
  },
};

export const ROLE_TEXT: Record<RoleKey, string> = {
  regulator: "Owns the contracts. Also the market authority: mints OLV and sets the markup. Already set up by the migration.",
  inspector: "Records quality checkpoints and certifies batches. Already granted by the migration.",
  farmer: "Mints the batch and hands it to the mill.",
  mill: "Receives the lot from the farmer and hands it to the distributor.",
  distributor: "Lists the batch for sale and hands it to the grocery.",
  grocery: "Pays OLV into the escrow and receives the batch.",
};

/** The demo role an actor stands for, or null for "anyone" (no single account). */
export function roleOfActor(actor: Actor): RoleKey | null {
  return actor === "anyone" ? null : actor;
}
