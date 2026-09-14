# SITRA Cloud Deploy (Vercel unificado + Supabase) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correr la dApp completa en nube gratis: frontend + API serverless en un proyecto Vercel, brazo-b en segundo proyecto Vercel, datos en Supabase, contrato en Polygon Amoy.

**Architecture:** Astro con `@astrojs/vercel` expone páginas + `src/pages/api/*` (misma lógica del backend Express, adaptada a handlers serverless); Supabase Postgres vía pooler 6543; brazo-b reescrito como 2 funciones serverless en proyecto Vercel aparte (host independiente); `contracts/scripts/deploy.js` despliega a Amoy y siembra instituciones.

**Tech Stack:** Astro 4 + @astrojs/vercel, ethers v6 (cliente + server), pg 8 (pooler Supabase), Hardhat + OZ 5.0.2, MetaMask (solo UI operador), Vercel serverless, Supabase Postgres.

## Global Constraints

- Título/pregunta/hipótesis congelados (README). Oráculo explícito en UI. Llave comprometida pierde (no ocultar).
- Contrato byte-verbatim (`contracts/contracts/CustodyRegistry.sol`). Solo `hardhat.config.js` puede cambiar si la red lo exige (ya tiene viaIR).
- EIP-712 domain: name `CustodiaActas`, version `1`, Type `Transfer(address from,address to,bytes32 resourceId,bytes32 hashEvento,bytes32 hashPDF,uint256 nonce)`. ChainId 80002 en Amoy, 31337 en tests.
- Dos hashes bytes32 on-chain; UI verifica AMBOS (okEvento + okPDF, cierre final previo).
- Brazo B justo: proyecto Vercel SEPARADO (URL distinta, deploy independiente). Nunca `/api/brazo-b/*` dentro del proyecto principal.
- PROHIBIDO: tokens/NFT/SBT/IPFS/Merkle/IoT/IA. Secrets (`RELAY_KEY`, `DATABASE_URL`) solo en env de Vercel, nunca en git.
- Repo `sjmontano/SITRA`, branch `main`. Commits/push permitidos en SITRA.
- SIMEC no se toca.

---

## File Structure

```
frontend/
├── astro.config.mjs              # adapter node -> @astrojs/vercel
├── package.json                  # + @astrojs/vercel, ethers, pg
├── scripts/sync-abi.js           # copia ABI compilado a src/lib/server/contract-abi.json
├── src/lib/server/
│   ├── contract-abi.json         # ABI (generado, SÍ en git para Vercel build sin hardhat)
│   ├── db.js                     # pg Pool (Supabase pooler, ssl)
│   └── chain.js                  # ethers Contract con ABI local + env
├── src/lib/verify.js             # fetch relativo same-origin /api/...
├── src/lib/transfer-sign.js      # EIP-712 signTypedData en browser (MetaMask)
├── src/pages/index.astro         # landing
├── src/pages/registrar.astro     # form + firma emisor + POST /api/resources
├── src/pages/transferir/[id].astro # firma emisor + pegar sigTo + POST transfer
├── src/pages/verify/[id].astro   # existe (okEvento+okPDF+QR+oráculo)
└── src/pages/api/
    ├── resources/index.js        # POST registrar
    ├── resources/[id]/transfer.js
    ├── resources/[id]/return.js
    ├── resources/[id]/retire.js
    └── resources/verify/[id].js  # GET historia + offchain
contracts/scripts/deploy.js       # deploy Amoy + seed instituciones
brazo-b/
├── api/vc/issue.js               # serverless (issue stub)
├── api/status/1.js               # serverless (StatusList stub)
├── package.json                  # sin express
└── vercel.json                   # proyecto aparte
backend/                          # intacto (dev local); NO se despliega
docs/DEPLOY.md                    # runbook: Supabase + Vercel A/B + Amoy + env
```

---

### Task 1: Deploy script Amoy

**Files:**
- Create: `contracts/scripts/deploy.js`

**Interfaces:**
- Consumes: `contracts/contracts/CustodyRegistry.sol`, env `AMOY_RPC`, `DEPLOYER_KEY`, `SEED_A`, `SEED_B`.
- Produces: dirección contrato + 2 instituciones (consumen Tasks 2-5 vía `CONTRACT_ADDRESS`).

- [ ] **Step 1: Escribir contracts/scripts/deploy.js**

```js
const { ethers } = require("hardhat");
async function main() {
  const F = await ethers.getContractFactory("CustodyRegistry");
  const ctr = await F.deploy();
  await ctr.waitForDeployment();
  const addr = await ctr.getAddress();
  console.log(`CustodyRegistry: ${addr}`);
  for (const k of ["SEED_A", "SEED_B"]) {
    const a = process.env[k];
    if (!a) { console.log(`skip ${k}`); continue; }
    const tx = await ctr.registerInstitution(a);
    await tx.wait();
    console.log(`institucion ${k}=${a} tx=${tx.hash}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Verificar sintaxis sin red**

Run: `node --check scripts/deploy.js`
Expected: PASS (sin salida). Deploy real requiere `AMOY_RPC`+fondos: NO ejecutar en sandbox; documentar en Task 6.

- [ ] **Step 3: Commit**

```bash
git add contracts/scripts/deploy.js
git commit -m "feat: deploy Amoy + seed instituciones"
```

---

### Task 2: Runtime serverless (db + chain + ABI)

**Files:**
- Create: `frontend/src/lib/server/db.js`
- Create: `frontend/src/lib/server/chain.js`
- Create: `frontend/scripts/sync-abi.js`
- Create: `frontend/src/lib/server/contract-abi.json` (generado por script)

**Interfaces:**
- Consumes: `contracts/artifacts/.../CustodyRegistry.json`, env `DATABASE_URL`, `AMOY_RPC`, `CONTRACT_ADDRESS`, `RELAY_KEY`.
- Produces: `getPool()`, `getContract(signerOrProvider)` usados por Task 3.

- [ ] **Step 1: Escribir frontend/src/lib/server/db.js**

```js
import pg from "pg";
let pool = null;
export function getPool() {
  if (!pool) {
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 1 });
  }
  return pool;
}
```

- [ ] **Step 2: Escribir frontend/src/lib/server/chain.js**

```js
import { ethers } from "ethers";
import ABI from "./contract-abi.json" assert { type: "json" };
export function getContract(signerOrProvider) {
  return new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI.abi, signerOrProvider);
}
export function relaySigner() {
  return new ethers.Wallet(process.env.RELAY_KEY, new ethers.JsonRpcProvider(process.env.AMOY_RPC));
}
```

- [ ] **Step 3: Escribir frontend/scripts/sync-abi.js**

```js
import { copyFileSync, mkdirSync } from "node:fs";
mkdirSync(new URL("../src/lib/server/", import.meta.url), { recursive: true });
copyFileSync(
  new URL("../../contracts/artifacts/contracts/CustodyRegistry.sol/CustodyRegistry.json", import.meta.url),
  new URL("../src/lib/server/contract-abi.json", import.meta.url)
);
console.log("ABI synced");
```

- [ ] **Step 4: package.json frontend (añadir deps + script)**

```json
{ "scripts": { "build": "astro build", "sync:abi": "node scripts/sync-abi.js" },
  "dependencies": { "@astrojs/node": "^8.3.4", "@astrojs/vercel": "^7.0.0", "astro": "^4.0.0", "ethers": "^6.13.0", "pg": "^8.12.0", "react": "^18.0.0" } }
```

Editar `frontend/package.json` real preservando formato/campos existentes; solo añade `@astrojs/vercel`, `ethers`, `pg` y script `sync:abi`.

- [ ] **Step 5: Sincronizar ABI + checks**

Run: `npm install` en `frontend/`; `npm run sync:abi`; `node --check src/lib/server/db.js`
Expected: `ABI synced`, checks PASS, `contract-abi.json` existe con campo `abi`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/server frontend/scripts frontend/package.json
git commit -m "feat: runtime serverless db+chain+ABI"
```

---

### Task 3: Endpoints API en Astro

**Files:**
- Create: `frontend/src/pages/api/resources/index.js`
- Create: `frontend/src/pages/api/resources/[id]/transfer.js`
- Create: `frontend/src/pages/api/resources/[id]/return.js`
- Create: `frontend/src/pages/api/resources/[id]/retire.js`
- Create: `frontend/src/pages/api/resources/verify/[id].js`

**Interfaces:**
- Consumes: `getPool`, `getContract`, `relaySigner` de Task 2.
- Produces: `POST /api/resources`, `POST /api/resources/:id/{transfer,return,retire}`, `GET /api/resources/verify/:id` (consume Task 5).

- [ ] **Step 1: POST /api/resources**

```js
import { getPool } from "../../../../lib/server/db.js";
import { getContract, relaySigner } from "../../../../lib/server/chain.js";
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
```

- [ ] **Step 2: transfer/return/retire (misma forma, cambia método)**

```js
// transfer.js
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
// return.js → getContract(relaySigner()).returnResource(params.id, hashEvento)
// retire.js → getContract(relaySigner()).retireResource(params.id, hashEvento, sigCust, sigInst)
```

Repetir el bloque completo en cada archivo con su método (no importar cruzado entre endpoints).

- [ ] **Step 3: GET verify/[id].js**

```js
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
```

Serializa BigInts a String (cierra el diferido Task 4 del plan anterior al fin).

- [ ] **Step 4: Checks**

Run: `node --check` en los 5 archivos.
Expected: PASS. Sin live-test (sin Supabase/Amoy en sandbox).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/api
git commit -m "feat: API serverless recursos+verify"
```

---

### Task 4: Astro en Vercel + verify same-origin

**Files:**
- Modify: `frontend/astro.config.mjs`
- Modify: `frontend/src/lib/verify.js`

**Interfaces:**
- Consumes: endpoints Task 3.
- Produces: build Vercel + `/verify` sin `PUBLIC_API`.

- [ ] **Step 1: astro.config.mjs a Vercel**

```js
import vercel from "@astrojs/vercel/serverless";
export default { output: "server", adapter: vercel() };
```

Reemplaza el adaptador node (queda obsoleto en nube; dev local sigue con `astro dev`).

- [ ] **Step 2: verify.js same-origin**

```js
export async function loadVerify(id) {
  const r = await fetch(`/api/resources/verify/${id}`);
  const j = await r.json();
  const chain = (j.onchain || []).map((e) => ({ ...e, hashEvento: String(e.hashEvento ?? ""), hashPDF: String(e.hashPDF ?? ""), from: String(e.from ?? ""), to: String(e.to ?? ""), timestamp: String(e.timestamp ?? "") }));
  const last = chain[chain.length - 1];
  if (!last) return { onchain: [], offchain: j.offchain || null, custodio: null, okEvento: false, okPDF: false };
  const off = j.offchain || null;
  const okEvento = !!(off && String(off.hash_evento).toLowerCase() === last.hashEvento.toLowerCase());
  const okPDF = !!(off && String(off.hash_pdf).toLowerCase() === last.hashPDF.toLowerCase());
  return { onchain: chain, offchain: off, custodio: last.to, okEvento, okPDF };
}
```

En servidor (SSR) `fetch` relativo resuelve contra el propio deploy — sin `PUBLIC_API`.

- [ ] **Step 3: Build**

Run: `npm run build` en `frontend/`.
Expected: PASS con adaptador `@astrojs/vercel`.

- [ ] **Step 4: Commit**

```bash
git add frontend/astro.config.mjs frontend/src/lib/verify.js
git commit -m "feat: Astro en Vercel + verify same-origin"
```

---

### Task 5: dApp operador (landing + registrar + transferir)

**Files:**
- Create: `frontend/src/lib/transfer-sign.js`
- Create: `frontend/src/pages/index.astro`
- Create: `frontend/src/pages/registrar.astro`
- Create: `frontend/src/pages/transferir/[id].astro`

**Interfaces:**
- Consumes: endpoints Task 3, `loadVerify`.
- Produces: UI operable con MetaMask.

- [ ] **Step 1: transfer-sign.js (firma EIP-712 en browser)**

```js
import { ethers } from "ethers";
export async function signTransfer({ contractAddress, from, to, resourceId, hashEvento, hashPDF, nonce }) {
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const network = await provider.getNetwork();
  return signer.signTypedData(
    { name: "CustodiaActas", version: "1", chainId: Number(network.chainid ?? network.chainId), verifyingContract: contractAddress },
    { Transfer: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "resourceId", type: "bytes32" }, { name: "hashEvento", type: "bytes32" }, { name: "hashPDF", type: "bytes32" }, { name: "nonce", type: "uint256" }] },
    { from, to, resourceId, hashEvento, hashPDF, nonce }
  );
}
export function keccakOf(obj) {
  const s = typeof obj === "string" ? obj : JSON.stringify(obj);
  return ethers.keccak256(ethers.toUtf8Bytes(s));
}
```

OJO: `network.chainid` no existe — usar `Number(network.chainId)` directo. El objeto network de ethers v6 expone `chainId` (bigint). Escribir `chainId: Number(network.chainId)`.

- [ ] **Step 2: index.astro (landing)**

```astro
---
---
<h1>SITRA — Sistema de Trazabilidad de Recursos</h1>
<p>Registro append-only con autorización dual. No afirma verdad física ni localización.</p>
<nav><a href="/registrar">Registrar</a> | <a href="/verify/0x00">Verificar ejemplo</a></nav>
```

- [ ] **Step 3: registrar.astro (form + keccak + POST)**

Formulario con campos to, acta JSON, pdfHash (hex manual en MVP: el PDF real se guarda después en Supabase Storage — fuera de alcance; campo `pdfUrl` texto). Al enviar: calcula `hashEvento=keccakOf(acta)`, pide cuenta MetaMask como `from`, `POST /api/resources` con `{resourceId: keccakOf(acta+Date.now()), to, hashEvento, hashPDF: pdfHash, pdfUrl}`. Muestra `tx`. Script cliente con `import { keccakOf } from "../lib/transfer-sign.js"`.

- [ ] **Step 4: transferir/[id].astro (doble firma con pegado)**

Carga `loadVerify(id)` en frontmatter para mostrar custodio y nonce sugerido (`onchain.length`). Cliente: conecta MetaMask (emisor), firma con `signTransfer` (nonce = onchain.length + ajuste manual), campo textarea para pegar `sigTo` del receptor (el receptor abre la misma URL en otro navegador y firma el mismo payload), botón envía `POST /api/resources/:id/transfer`. Muestra `tx` o `error`.

- [ ] **Step 5: Build + commit**

Run: `npm run build` en `frontend/`. Expected: PASS.
```bash
git add frontend/src/lib/transfer-sign.js frontend/src/pages/index.astro frontend/src/pages/registrar.astro frontend/src/pages/transferir
git commit -m "feat: dApp registrar+transferir con MetaMask"
```

---

### Task 6: Brazo-b en proyecto Vercel aparte + docs DEPLOY

**Files:**
- Create: `brazo-b/api/vc/issue.js`
- Create: `brazo-b/api/status/1.js`
- Create: `brazo-b/package.json`
- Create: `brazo-b/vercel.json`
- Create: `docs/DEPLOY.md`

**Interfaces:**
- Consumes: nada (stub independiente).
- Produces: B desplegable con URL propia.

- [ ] **Step 1: api/vc/issue.js**

```js
export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { id } = req.body || {};
  return res.status(200).json({ vc: { id: id || null, issuer: "did:web:brazo-b", sig: "stub" } });
}
```

- [ ] **Step 2: api/status/1.js**

```js
const revoked = [];
export default function handler(req, res) {
  return res.status(200).json({ revoked });
}
```

Nota: serverless sin estado — `revoked` siempre vacío; declararlo en DEPLOY (stub de independencia, no de revocación real).

- [ ] **Step 3: package.json + vercel.json**

```json
{ "name": "sitra-brazo-b", "version": "0.1.0", "private": true }
```

```json
{ "$schema": "https://openapi.vercel.sh/vercel.json", "functions": { "api/**/*.js": { "maxDuration": 10 } } }
```

- [ ] **Step 4: docs/DEPLOY.md (runbook)**

```markdown
# Deploy SITRA nube gratis

## 1. Supabase
- Crea proyecto gratis, copia `DATABASE_URL` pooler (puerto 6543) + `DIRECT_URL` (5432).
- Ejecuta `backend/sql/01_offchain.sql` en el SQL editor (crea `resources_offchain`; crea esquema `brazo_a` si se usa brazo A).

## 2. Contrato Amoy
- Faucet Amoy para `DEPLOYER_KEY`. `cd contracts && AMOY_RPC=... DEPLOYER_KEY=... SEED_A=0x.. SEED_B=0x.. npx hardhat run scripts/deploy.js --network amoy`.
- Guarda `CONTRACT_ADDRESS`.

## 3. Vercel proyecto A (dApp+API)
- Importa `sjmontano/SITRA`, Root Directory `frontend`, framework Astro.
- Env: `DATABASE_URL` (pooler), `AMOY_RPC`, `CONTRACT_ADDRESS`, `RELAY_KEY` (secreto).
- Deploy. Rutas: `/`, `/registrar`, `/transferir/:id`, `/verify/:id`, `/api/*`.

## 4. Vercel proyecto B (brazo-b)
- Importa mismo repo, Root Directory `brazo-b`. Sin env. Anota su URL para la tabla del experimento.

## 5. Verificar
- `GET /api/resources/verify/<id>` responde `{onchain, offchain}`.
- MetaMask en Amoy (chainId 80002) para operar.
```

- [ ] **Step 5: Commit**

```bash
git add brazo-b docs/DEPLOY.md
git commit -m "feat: brazo-b serverless + runbook deploy"
```

---

## Self-Review

1. **Spec coverage:** deploy Amoy ✓ (T1), runtime serverless ✓ (T2), 5 endpoints ✓ (T3), adapter Vercel + same-origin ✓ (T4), dApp completa ✓ (T5), B aparte + runbook ✓ (T6). Hipótesis/oráculo/llave-pierde intactos en README (no se tocan).
2. **Placeholder scan:** sin TBD/TODO; cada step trae código copiable. `transfer-sign.js` corregido (`network.chainId` directo, sin `chainid`). API repite bloques por archivo (no "similar a").
3. **Type consistency:** `resourceId/hashEvento/hashPDF` bytes32 hex `0x` en UI→API→contrato; `nonce` Number en firma; `historia()` serializada a String en endpoint (BigInt-safe); `loadVerify` devuelve `{onchain, offchain, custodio, okEvento, okPDF}` igual que la UI espera.

## Execution Handoff

Plan completo y guardado en `docs/superpowers/plans/2026-09-14-sitra-cloud-deploy.md`. Ejecuto con Subagent-Driven (preferencia vigente) salvo que pidas Inline.
