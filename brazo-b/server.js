const express = require("express"); const app = express(); app.use(express.json());
const revoked = new Set();
app.post("/vc/issue", (req, res) => res.json({ vc: { id: req.body.id, issuer: "did:web:localhost:3100", sig: "stub" } }));
app.get("/status/1", (req, res) => res.json({ revoked: [...revoked] }));
app.listen(3100);
