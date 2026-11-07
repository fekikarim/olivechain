import { getContract } from "@/lib/contracts";

export const STATES = ["None", "Created", "Deposited", "Released", "Refunded", "Cancelled"] as const;
export type SaleState = (typeof STATES)[number];

export type Sale = {
  id: number; seller: string; buyer: string; batchId: number; price: bigint; state: SaleState;
  certified: boolean; custodian: string;
};

export type Market = {
  symbol: string; balance: bigint; allowance: bigint; coinOwner: string; escrowOwner: string;
  markup: number; escrowAddress: string; sales: Sale[];
};

export async function loadMarket(account: string | null): Promise<Market | null> {
  const coin = getContract("OliveCoin");
  const escrow = getContract("PriceCapEscrow");
  const registry = getContract("BatchRegistry");
  if (!coin || !escrow || !registry) return null;

  const escrowAddress = await escrow.getAddress();
  const [symbol, coinOwner, escrowOwner, markup, count, balance, allowance] = await Promise.all([
    coin.symbol(), coin.owner(), escrow.owner(), escrow.maxMarkupPercent(), escrow.saleCount(),
    account ? coin.balanceOf(account) : 0n,
    account ? coin.allowance(account, escrowAddress) : 0n,
  ]);
  const total = Number(count);
  const sales = await Promise.all(
    Array.from({ length: total }, async (_, i): Promise<Sale> => {
      const id = total - i;
      const s = await escrow.getSale(id);
      const batchId = Number(s.batchId);
      const [certified, custodian] = await Promise.all([registry.isCertified(batchId), registry.custodianOf(batchId)]);
      return { id, seller: s.seller, buyer: s.buyer, batchId, price: s.price, state: STATES[Number(s.state)], certified, custodian };
    }),
  );
  return { symbol, balance, allowance, coinOwner, escrowOwner, markup: Number(markup), escrowAddress, sales };
}
