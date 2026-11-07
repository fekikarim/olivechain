export function TxNote({ pending, error, done }: { pending: boolean; error: string | null; done: string | null }) {
  if (pending) return <p role="status" className="text-sm text-muted">Waiting for MetaMask and the block…</p>;
  if (error) return <p role="alert" className="text-sm font-medium text-bad">{error}</p>;
  if (done) return <p role="status" className="text-sm font-medium text-olive">{done} ✓</p>;
  return null;
}
