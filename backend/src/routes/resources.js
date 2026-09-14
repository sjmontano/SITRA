const express = require("express"); const { ethers } = require("ethers");
const db = require("../db"); const { getContract } = require("../chain");
const r = express.Router();
r.post("/", async (req, res) => {
  try {
    const { resourceId, to, hashEvento, hashPDF, pdfUrl } = req.body;
    const signer = new ethers.Wallet(process.env.RELAY_KEY, new ethers.JsonRpcProvider(process.env.AMOY_RPC));
    const tx = await getContract(signer).registerResource(resourceId, to, hashEvento, hashPDF);
    await tx.wait();
    await db.query("INSERT INTO resources_offchain(resource_id,pdf_url,hash_evento,hash_pdf) VALUES($1,$2,$3,$4)", [resourceId, pdfUrl, hashEvento, hashPDF]);
    res.json({ tx: tx.hash });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});
r.post("/:id/transfer", async (req, res) => {
  try {
    const { from, to, hashEvento, hashPDF, sigFrom, sigTo } = req.body;
    const signer = new ethers.Wallet(process.env.RELAY_KEY, new ethers.JsonRpcProvider(process.env.AMOY_RPC));
    const tx = await getContract(signer).executeTransfer(req.params.id, from, to, hashEvento, hashPDF, sigFrom, sigTo);
    await tx.wait(); res.json({ tx: tx.hash });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});
r.post("/:id/return", async (req, res) => {
  try {
    const { hashEvento } = req.body;
    const signer = new ethers.Wallet(process.env.RELAY_KEY, new ethers.JsonRpcProvider(process.env.AMOY_RPC));
    const tx = await getContract(signer).returnResource(req.params.id, hashEvento);
    await tx.wait(); res.json({ tx: tx.hash });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});
r.post("/:id/retire", async (req, res) => {
  try {
    const { hashEvento, sigCust, sigInst } = req.body;
    const signer = new ethers.Wallet(process.env.RELAY_KEY, new ethers.JsonRpcProvider(process.env.AMOY_RPC));
    const tx = await getContract(signer).retireResource(req.params.id, hashEvento, sigCust, sigInst);
    await tx.wait(); res.json({ tx: tx.hash });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});
r.get("/verify/:id", async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC);
    const hist = await getContract(provider).historia(req.params.id);
    const off = await db.query("SELECT * FROM resources_offchain WHERE resource_id=$1", [req.params.id]);
    res.json({ onchain: hist, offchain: off.rows[0] || null });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});
module.exports = r;
