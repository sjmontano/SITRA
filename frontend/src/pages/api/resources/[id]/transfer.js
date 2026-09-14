import { getContract, relaySigner } from "../../../../lib/server/chain.js";
export const prerender = false;
export async function POST({ request, params }) {
  try {
    const { from, to, hashEvento, hashPDF, sigFrom, sigTo } = await request.json();
    const tx = await getContract(relaySigner()).executeTransfer(params.id, from, to, hashEvento, hashPDF, sigFrom, sigTo);
    await tx.wait();
    return Response.json({ tx: tx.hash });
  } catch (e) { return Response.json({ error: String(e.message || e) }, { status: 500 }); }
}
