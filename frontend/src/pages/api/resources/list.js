import { getPool } from "../../../lib/server/db.js";
export const prerender = false;
// GET /api/resources/list — últimos recursos off-chain (para "ya creados").
// Si no hay DB configurada responde { items: [], demo: true } en vez de 500.
export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return Response.json({ items: [], demo: true, note: "sin DATABASE_URL" });
    }
    const r = await getPool().query(
      "SELECT resource_id, pdf_url, hash_evento, hash_pdf FROM resources_offchain ORDER BY resource_id DESC LIMIT 50"
    );
    return Response.json({ items: r.rows, demo: false });
  } catch (e) {
    return Response.json({ items: [], demo: true, note: String(e.message || e) });
  }
}
