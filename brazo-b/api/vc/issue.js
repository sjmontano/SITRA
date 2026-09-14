export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { id } = req.body || {};
  return res.status(200).json({ vc: { id: id || null, issuer: "did:web:brazo-b", sig: "stub" } });
}
