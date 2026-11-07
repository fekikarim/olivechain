export const metadata = { title: "Guide: OliveChain" };

const accounts = [
  ["Regulator", "Ganache account 1", "Owns the registry. Grants the inspector role."],
  ["Inspector", "Ganache account 2", "Adds checkpoints and certifies batches. Already granted by the migration."],
  ["Farmer", "Ganache account 3", "Mints batches."],
  ["Mill operator", "Ganache account 4", "Receives the lot from the farmer."],
  ["Distributor", "Ganache account 5", "Lists the bottled lot for sale."],
  ["Grocery", "Ganache account 6", "Buys the lot with OLV."],
];

const steps = [
  ["Farmer", "Registry", "Mint a batch with the declared price of 200 OLV."],
  ["Farmer", "Registry", "Transfer custody to the mill operator, then the mill operator to the distributor."],
  ["Inspector", "Registry", "Add a checkpoint (acidity 0.3, polyphenols 320) and certify the batch."],
  ["Distributor", "Market", "List the batch at 300 OLV. The escrow rejects it: the cap is 240 OLV."],
  ["Distributor", "Market", "List it again at 230 OLV. Accepted."],
  ["Grocery", "Market", "Deposit 230 OLV. The app approves the escrow first, then deposits."],
  ["Distributor", "Registry", "Transfer custody to the grocery."],
  ["Anyone", "Market", "Release the payment. The distributor receives 230 OLV and the registry records 230 OLV as the new last price."],
];

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-[1280px] px-5 pb-8 md:px-8">
      <h1 className="py-8 text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-none tracking-tighter text-deep">Guide</h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight">Import these accounts into MetaMask</h2>
          <p className="mb-4 text-muted">Copy each private key from Ganache and import it into MetaMask on the OliveChain network (chain ID 1337). Name them like this.</p>
          <ul className="grid gap-2">
            {accounts.map(([role, acc, what]) => (
              <li key={role} className="bg-surface p-4"><p className="font-bold">{role} <span className="font-normal text-muted">· {acc}</span></p><p className="text-sm text-muted">{what}</p></li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-3 text-2xl font-bold tracking-tight">The supply chain story</h2>
          <ol className="grid list-decimal gap-2 pl-6 marker:font-bold marker:text-olive">
            {steps.map(([who, where, what], i) => (
              <li key={i} className="pl-2"><b>{who}</b> on <b>{where}</b>: {what}</li>
            ))}
          </ol>
          <p className="mt-6 bg-surface p-4 text-sm text-muted">Also try: release before certification (blocked), release before custody moves (blocked), and a refund when the delivery never happens.</p>
        </section>
      </div>
    </div>
  );
}
