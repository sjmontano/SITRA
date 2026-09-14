import { getPool } from "../../../lib/server/db.js";
import { getContract, relaySigner } from "../../../lib/server/chain.js";
export const prerender = false;
export async function POST({ request }) {
  try {
    const { resourceId, to, hashEvento, hashPDF, pdfUrl } = await request.json();
    const tx = await getContract(relaySigner()).registerResource(resourceId, to, hashEvento, hashPDF);
    await tx.wait();
    await getPool().query(
      "INSERT INTO resources_offchain(resource_id,pdf_url,hash_evento,hash_pdf) VALUES($1,$2,$3,$4)",
      [resourceId, pdfUrl, hashEvento, hashPDF]
    );
    return Response.json({ tx: tx.hash });
  } catch (e) { return Response.json({ error: String(e.message || e) }, { status: 500 }); }
}
