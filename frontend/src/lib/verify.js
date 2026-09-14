export async function loadVerify(id) {
  const r = await fetch(`${import.meta.env.PUBLIC_API}/resources/verify/${id}`);
  const j = await r.json();
  const chain = (j.onchain || []).map(e => ({ ...e, hashEvento: String(e.hashEvento ?? ""), hashPDF: String(e.hashPDF ?? ""), from: String(e.from ?? ""), to: String(e.to ?? ""), timestamp: String(e.timestamp ?? "") }));
  const last = chain[chain.length - 1];
  if (!last) return { onchain: [], offchain: j.offchain || null, custodio: null, okEvento: false, okPDF: false };
  const okEvento = !!(j.offchain && String(j.offchain.hash_evento).toLowerCase() === last.hashEvento.toLowerCase());
  const okPDF = !!(j.offchain && String(j.offchain.hash_pdf).toLowerCase() === last.hashPDF.toLowerCase());
  return { onchain: chain, offchain: j.offchain || null, custodio: last.to, okEvento, okPDF };
}
