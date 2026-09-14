import { ethers } from "ethers";
import { getPool } from "../../../../lib/server/db.js";
import { getContract } from "../../../../lib/server/chain.js";
export const prerender = false;
export async function GET({ params }) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC);
    const hist = await getContract(provider).historia(params.id);
    const onchain = hist.map((e) => ({ resourceId: String(e.resourceId), eventType: Number(e.eventType), from: String(e.from), to: String(e.to), hashEvento: String(e.hashEvento), hashPDF: String(e.hashPDF), timestamp: String(e.timestamp), estado: Number(e.estado) }));
    const off = await getPool().query("SELECT * FROM resources_offchain WHERE resource_id=$1", [params.id]);
    return Response.json({ onchain, offchain: off.rows[0] || null });
  } catch (e) { return Response.json({ error: String(e.message || e) }, { status: 500 }); }
}
