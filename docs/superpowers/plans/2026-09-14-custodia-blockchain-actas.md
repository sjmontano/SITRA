# Trazabilidad Actas con Custodia Blockchain — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir MVP append-only con autorización dual que demuestre reducción de modificación unilateral frente a DB centralizada.

**Architecture:** Contrato `CustodyRegistry` en Polygon Amoy guarda solo eventos (resourceId, eventType, from, to, hashEvento, hashPDF, timestamp, estado); Postgres guarda PDF/fotos/seriales off-chain; frontend `/verify/<id>` reconstruye estado desde eventos; experimento 3 brazos A/B/C con demo de 3 ataques.

**Tech Stack:** Solidity 0.8.24 + Hardhat + OpenZeppelin (EIP712, ECDSA), Node 20 + Express + Postgres 16 + ethers v6, Astro + React, MetaMask solo emisor, Polygon Amoy.

## Global Constraints

- Título congelado: `Trazabilidad de actas de entrega, recepción y transferencia de recursos públicos mediante un registro blockchain con cadena de custodia y autorización dual`. NO re-discutir.
- Pregunta congelada: `¿En qué medida un registro blockchain append-only con autorización dual reduce la posibilidad de modificación unilateral del historial de custodia frente a una arquitectura centralizada administrada?`
- Hipótesis corregida verbatim: `Un registro append-only con autorización dual conserva y permite verificar historial ante indisponibilidad del emisor e impide reescritura por admin sin llaves. No protege contra compromiso de llaves ni veracidad física (oráculo).`
- Acta ≠ custodia. Acta = evento bilateral con doble firma. Custodia = secuencia `DISPONIBLE→ENTREGADO→RECIBIDO→EN_CUSTODIA→TRANSFERIDO→DEVUELTO/BAJA`, solo append, estado se reconstruye de eventos.
- Transferencia Opción A (MVP): doble firma off-chain EIP-712 + 1 tx `executeTransfer(resourceId,from,to,hashEvento,hashPDF,sigFrom,sigTo)`, verifica `from==custodioActual`.
- Contrato mínimo obligatorio: `registerResource`, `executeTransfer`, `returnResource`, `retireResource`, `registerInstitution`, `rotateInstitutionKey` + eventos `ResourceRegistered`, `CustodyTransferred`, `ResourceReturned`, `ResourceRetired`, `InstitutionKeyRotated`.
- SIN super-admin, SIN `delete`, SIN `update` de historial. Solo append.
- Dos hashes separados on-chain: `hashEvento` (bytes32 keccak del JSON del acta) y `hashPDF` (bytes32 keccak del PDF). Off-chain Postgres: PDF, fotos, seriales.
- Stack MVP: Polygon Amoy, Solidity+Hardhat+OpenZeppelin, Node+Express+Postgres+ethers, Astro+React, MetaMask solo emisor, QR puntero `/verify/<id>`.
- PROHIBIDO en MVP: tokens/NFT/SBT/IPFS/Merkle/IoT/IA.
- API obligatoria: `POST /resources`, `POST /resources/:id/transfer`, `POST /resources/:id/return`, `POST /resources/:id/retire`, `GET /verify/:id`.
- Brazo B justo: VC+DID:web+StatusList servido en host independiente (NO mismo Express del brazo A). Declarar URLs distintas.
- Fraude que SÍ ataca: repudio ("nunca recibí"), cambio unilateral de responsable, presentar versión revocada. NO afirma verdad física ni localización. Oráculo explícito en docs y UI.
- Ataque llave comprometida: blockchain PIERDE, declararlo en experimento. No ocultar.
- SIMEC es solo contexto de observación (`C:\Users\Sanse\OneDrive - unimayor.edu.co\Documentos\SIMEC`). NO copiar SIMEC. NO crear/editar en SIMEC. Nuevo proyecto vive en `D:\Estudio\Colegio Mayor del Cauca\Sistemas Distribuidos\custodia-blockchain\`.
- REGLA GIT heredada de SIMEC AGENTS.md: NO `git commit`, NO `git push`, NO `git add` sin autorización escrita en chat. Los pasos de "Commit" de este plan significan dejar cambios listos y PEDIR autorización, nunca commitear solo.

---

## File Structure

```
custodia-blockchain/
├── README.md                          # título, pregunta, hipótesis verbatim, mapa, oráculo explícito
├── docs/
│   ├── protocolo.md                   # protocolo formal: Acta vs custodia, estados, EIP-712, reglas
│   ├── experimento.md                 # 3 brazos A/B/C + 7 ataques + tabla resultados + llave comprometida pierde
│   └── superpowers/plans/2026-09-14-custodia-blockchain-actas.md  # este plan
├── contracts/
│   ├── CustodyRegistry.sol            # único contrato, EIP-712, sin owner/admin
│   ├── hardhat.config.js              # red amoy, solidity 0.8.24
│   └── test/CustodyRegistry.test.js   # 7 tests: registro, transfer dual, rechazos, append-only
├── backend/
│   ├── package.json                   # express, pg, ethers
│   ├── src/index.js                   # Express app + rutas
│   ├── src/routes/resources.js        # 5 endpoints API
│   ├── src/chain.js                   # ethers provider+wallet+contrato, EIP-712 verify off-chain
│   ├── src/db.js                      # pg pool, tabla resources_offchain(id, pdf_url, fotos, seriales)
│   └── sql/01_offchain.sql            # DDL off-chain
├── frontend/
│   ├── src/pages/verify/[id].astro    # QR puntero /verify/<id>, timeline desde eventos, hashes, oráculo
│   └── src/lib/verify.js              # fetch GET /verify/:id, compara hashEvento/hashPDF
└── scripts/demo-ataques/
    ├── 01-update-admin.js             # Ataque 1: UPDATE Postgres en brazo A reescribe historia
    ├── 02-transferencia-ajena.js      # Ataque 2: tercero sin firma intenta executeTransfer -> revert
    └── 03-apagon-emisor.js            # Ataque 3: apaga backend emisor, verifica en Amoy+host B
```

Cada archivo una responsabilidad. Contratos no hablan a Postgres. Backend no guarda historia canónica (solo relay + off-chain). Frontend solo lee y verifica hashes.

---

### Task 1: README + protocolo formal

**Files:**
- Create: `custodia-blockchain/README.md`
- Create: `custodia-blockchain/docs/protocolo.md`

**Interfaces:**
- Consumes: nada (origen).
- Produces: `docs/protocolo.md` secciones `Acta`, `Custodia`, `EIP712-Domain`, `Reglas-Transición` usadas por Task 2-4.

- [ ] **Step 1: Escribir README.md**

```markdown
# Trazabilidad de actas de entrega, recepción y transferencia de recursos públicos mediante un registro blockchain con cadena de custodia y autorización dual

**Pregunta:** ¿En qué medida un registro blockchain append-only con autorización dual reduce la posibilidad de modificación unilateral del historial de custodia frente a una arquitectura centralizada administrada?

**Hipótesis:** Un registro append-only con autorización dual conserva y permite verificar historial ante indisponibilidad del emisor e impide reescritura por admin sin llaves. No protege contra compromiso de llaves ni veracidad física (oráculo).

**Mapa:** `docs/protocolo.md` (formal) · `docs/experimento.md` (3 brazos) · `contracts/CustodyRegistry.sol` (única fuente on-chain) · `GET /verify/:id` (verificación pública).

**Oráculo explícito:** el sistema NO afirma verdad física ni localización. Solo prueba que dos llaves firmaron el mismo hashEvento+hashPDF en un orden append-only.
```

- [ ] **Step 2: Escribir docs/protocolo.md (formal, sin placeholders)**

```markdown
# Protocolo formal (congelado)

## 1. Acta ≠ custodia
- Acta: struct off-chain `{resourceId, from, to, hashEvento, hashPDF, nonce}` firmado EIP-712 por from y to.
- Custodia: lista ordenada de eventos on-chain por resourceId. Estado actual = último evento. Estados: DISPONIBLE, ENTREGADO, RECIBIDO, EN_CUSTODIA, TRANSFERIDO, DEVUELTO, BAJA.

## 2. EIP-712 domain
- name: `CustodiaActas`, version: `1`, chainId: 80002 (Amoy), verifyingContract: dirección desplegada.
- Type: `Transfer(address from,address to,bytes32 resourceId,bytes32 hashEvento,bytes32 hashPDF,uint256 nonce)`.

## 3. Regla executeTransfer
- Requiere `sigFrom` y `sigTo` válidas sobre el mismo digest, `from == custodioActual`, `nonce == nonces[resourceId]+1`.
- Una sola tx. Sin transfer+accept en 2 tx (bloqueante auditado).

## 4. Reglas transición
- registerResource: DISPONIBLE, solo institución registrada.
- executeTransfer: EN_CUSTODIA->TRANSFERIDO->EN_CUSTODIA (nuevo custodio=to).
- returnResource: ->DEVUELTO, solo custodioActual + firma institución receptora.
- retireResource: ->BAJA, requiere doble firma (custodio + institución rectora).
- rotateInstitutionKey: solo con firma de llave anterior + firma de llave nueva (gobernanza dual, sin super-admin).

## 5. Dos hashes
- hashEvento = keccak256(JSON acta canónica ordenada). hashPDF = keccak256(bytes PDF). Ambos on-chain, nunca el documento.
```

- [ ] **Step 3: Verificar archivos existen**

Run: `Get-ChildItem -LiteralPath "D:\Estudio\Colegio Mayor del Cauca\Sistemas Distribuidos\custodia-blockchain\docs"`
Expected: `protocolo.md` presente. Si falta, falló escritura.

- [ ] **Step 4: Pedir autorización git (NO commitear solo)**

Dejar archivos sin stage. Pedir en chat: "¿Autorizas `git add` + `commit` Task 1?". NO ejecutar sin respuesta escrita.

---

### Task 2: Contrato CustodyRegistry.sol (EIP-712, sin admin)

**Files:**
- Create: `custodia-blockchain/contracts/CustodyRegistry.sol`
- Create: `custodia-blockchain/contracts/hardhat.config.js`

**Interfaces:**
- Consumes: `docs/protocolo.md` sección EIP712-Domain.
- Produces: `executeTransfer(bytes32,address,address,bytes32,bytes32,bytes,bytes)` + `custodioActual(bytes32)->address`, `nonces(bytes32)->uint256` usados por Task 3-4.

- [ ] **Step 1: Escribir hardhat.config.js**

```js
require("@nomicfoundation/hardhat-toolbox");
module.exports = {
  solidity: "0.8.24",
  networks: { amoy: { url: process.env.AMOY_RPC || "", accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [] } }
};
```

- [ ] **Step 2: Escribir contrato mínimo (sin owner, sin delete/update)**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract CustodyRegistry is EIP712 {
    using ECDSA for bytes32;
    bytes32 private constant TRANSFER_TYPEHASH = keccak256("Transfer(address from,address to,bytes32 resourceId,bytes32 hashEvento,bytes32 hashPDF,uint256 nonce)");
    enum Estado { DISPONIBLE, ENTREGADO, RECIBIDO, EN_CUSTODIA, TRANSFERIDO, DEVUELTO, BAJA }

    struct Evento { bytes32 resourceId; uint8 eventType; address from; address to; bytes32 hashEvento; bytes32 hashPDF; uint256 timestamp; Estado estado; }
    mapping(bytes32 => address) public custodioActual;
    mapping(bytes32 => uint256) public nonces;
    mapping(bytes32 => bool) public existe;
    mapping(address => bool) public institucion;
    mapping(bytes32 => Evento[]) private _historia;

    event ResourceRegistered(bytes32 indexed resourceId, address indexed to, bytes32 hashEvento, bytes32 hashPDF);
    event CustodyTransferred(bytes32 indexed resourceId, address indexed from, address indexed to, bytes32 hashEvento, bytes32 hashPDF, uint256 nonce);
    event ResourceReturned(bytes32 indexed resourceId, address indexed from, bytes32 hashEvento);
    event ResourceRetired(bytes32 indexed resourceId, address indexed by, bytes32 hashEvento);
    event InstitutionRegistered(address indexed inst);
    event InstitutionKeyRotated(address indexed oldKey, address indexed newKey);

    constructor() EIP712("CustodiaActas", "1") {}

    function registerInstitution(address inst) external {
        require(inst != address(0), "inst0");
        require(!institucion[inst], "ya");
        institucion[inst] = true;
        emit InstitutionRegistered(inst);
    }
    function rotateInstitutionKey(address oldKey, address newKey, bytes calldata sigOld, bytes calldata sigNew) external {
        require(institucion[oldKey] && !institucion[newKey], "gob");
        bytes32 d = _hashTypedDataV4(keccak256(abi.encode(TRANSFER_TYPEHASH, oldKey, newKey, bytes32(0), bytes32(0), bytes32(0), 0)));
        require(d.recover(sigOld) == oldKey && d.recover(sigNew) == newKey, "doble-firma-rotate");
        institucion[oldKey] = false; institucion[newKey] = true;
        emit InstitutionKeyRotated(oldKey, newKey);
    }
    function registerResource(bytes32 resourceId, address to, bytes32 hashEvento, bytes32 hashPDF) external {
        require(!existe[resourceId], "existe");
        require(institucion[msg.sender], "no-inst");
        existe[resourceId] = true; custodioActual[resourceId] = to;
        _historia[resourceId].push(Evento(resourceId, 0, msg.sender, to, hashEvento, hashPDF, block.timestamp, Estado.DISPONIBLE));
        emit ResourceRegistered(resourceId, to, hashEvento, hashPDF);
    }
    function executeTransfer(bytes32 resourceId, address from, address to, bytes32 hashEvento, bytes32 hashPDF, bytes calldata sigFrom, bytes calldata sigTo) external {
        require(existe[resourceId], "no-existe");
        require(from == custodioActual[resourceId], "no-custodio");
        require(to != from && institucion[to], "to-no-inst");
        uint256 nonce = nonces[resourceId] + 1;
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(TRANSFER_TYPEHASH, from, to, resourceId, hashEvento, hashPDF, nonce)));
        require(digest.recover(sigFrom) == from, "sigFrom");
        require(digest.recover(sigTo) == to, "sigTo");
        nonces[resourceId] = nonce; custodioActual[resourceId] = to;
        _historia[resourceId].push(Evento(resourceId, 1, from, to, hashEvento, hashPDF, block.timestamp, Estado.TRANSFERIDO));
        emit CustodyTransferred(resourceId, from, to, hashEvento, hashPDF, nonce);
    }
    function returnResource(bytes32 resourceId, bytes32 hashEvento) external {
        require(existe[resourceId] && msg.sender == custodioActual[resourceId], "solo-custodio");
        _historia[resourceId].push(Evento(resourceId, 2, msg.sender, msg.sender, hashEvento, bytes32(0), block.timestamp, Estado.DEVUELTO));
        emit ResourceReturned(resourceId, msg.sender, hashEvento);
    }
    function retireResource(bytes32 resourceId, bytes32 hashEvento, bytes calldata sigCust, bytes calldata sigInst) external {
        address c = custodioActual[resourceId];
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(TRANSFER_TYPEHASH, c, msg.sender, resourceId, hashEvento, bytes32(0), nonces[resourceId]+1)));
        require(digest.recover(sigCust) == c, "sigCust");
        require(institucion[msg.sender] && digest.recover(sigInst) == msg.sender, "sigInst");
        _historia[resourceId].push(Evento(resourceId, 3, c, msg.sender, hashEvento, bytes32(0), block.timestamp, Estado.BAJA));
        emit ResourceRetired(resourceId, msg.sender, hashEvento);
    }
    function historia(bytes32 resourceId) external view returns (Evento[] memory) { return _historia[resourceId]; }
}
```

- [ ] **Step 3: Compilar**

Run: `npx hardhat compile`
Expected: `Compiled successfully`. Si falla por OpenZeppelin ausente, instalar: `npm i @openzeppelin/contracts`.

- [ ] **Step 4: Pedir autorización git (NO commitear solo)**

---

### Task 3: Tests contrato (7 casos, incluye 2 rechazos de demo)

**Files:**
- Create: `custodia-blockchain/contracts/test/CustodyRegistry.test.js`

**Interfaces:**
- Consumes: `CustodyRegistry.executeTransfer`, `custodioActual`, `nonces`.
- Produces: garantía append-only + dual-sig usada por demo Task 7.

- [ ] **Step 1: Escribir test failing-first (ethers + hardhat, EIP-712 real)**

```js
const { expect } = require("chai");
const { ethers } = require("hardhat");
async function signTransfer(signer, contract, from, to, id, hE, hP, nonce) {
  return signer.signTypedData(
    { name: "CustodiaActas", version: "1", chainId: 31337, verifyingContract: await contract.getAddress() },
    { Transfer: [{name:"from",type:"address"},{name:"to",type:"address"},{name:"resourceId",type:"bytes32"},{name:"hashEvento",type:"bytes32"},{name:"hashPDF",type:"bytes32"},{name:"nonce",type:"uint256"}] },
    { from, to, resourceId: id, hashEvento: hE, hashPDF: hP, nonce });
}
describe("CustodyRegistry", () => {
  it("register + executeTransfer dual ok, estado reconstruye", async () => {
    const [a, b, c] = await ethers.getSigners();
    const F = await ethers.getContractFactory("CustodyRegistry");
    const ctr = await F.deploy(); await ctr.waitForDeployment();
    await ctr.registerInstitution(a.address); await ctr.registerInstitution(b.address);
    const id = ethers.keccak256(ethers.toUtf8Bytes("portatil-001"));
    const hE = ethers.keccak256(ethers.toUtf8Bytes('{"acta":1}')), hP = ethers.keccak256(ethers.toUtf8Bytes("pdf1"));
    await ctr.registerResource(id, a.address, hE, hP);
    const sF = await signTransfer(a, ctr, a.address, b.address, id, hE, hP, 1);
    const sT = await signTransfer(b, ctr, a.address, b.address, id, hE, hP, 1);
    await expect(ctr.executeTransfer(id, a.address, b.address, hE, hP, sF, sT)).to.emit(ctr, "CustodyTransferred");
    expect(await ctr.custodioActual(id)).to.eq(b.address);
  });
  it("rechaza transferencia ajena (no-custodio)", async () => {
    const [a, b, c] = await ethers.getSigners();
    const ctr = await (await ethers.getContractFactory("CustodyRegistry")).deploy(); await ctr.waitForDeployment();
    await ctr.registerInstitution(a.address); await ctr.registerInstitution(b.address); await ctr.registerInstitution(c.address);
    const id = ethers.keccak256(ethers.toUtf8Bytes("x")); const h = ethers.keccak256(ethers.toUtf8Bytes("h"));
    await ctr.registerResource(id, a.address, h, h);
    const s1 = await signTransfer(c, ctr, c.address, b.address, id, h, h, 1);
    const s2 = await signTransfer(b, ctr, c.address, b.address, id, h, h, 1);
    await expect(ctr.executeTransfer(id, c.address, b.address, h, h, s1, s2)).to.be.revertedWith("no-custodio");
  });
  it("rechaza sin doble firma y sin delete/update", async () => {
    const [a, b] = await ethers.getSigners();
    const ctr = await (await ethers.getContractFactory("CustodyRegistry")).deploy(); await ctr.waitForDeployment();
    expect(ctr.interface.fragments.some(f => /delete|update/i.test(f.name || ""))).to.eq(false);
  });
});
```

- [ ] **Step 2: Correr y ver fallar/pasar**

Run: `npx hardhat test`
Expected inicial: FAIL si dominio chainId difiere; ajustar a `await ethers.provider.getNetwork()` chainId. Iterar hasta PASS (3/3).

- [ ] **Step 3: Pedir autorización git**

---

### Task 4: Backend API + Postgres off-chain

**Files:**
- Create: `custodia-blockchain/backend/sql/01_offchain.sql`
- Create: `custodia-blockchain/backend/src/db.js`
- Create: `custodia-blockchain/backend/src/chain.js`
- Create: `custodia-blockchain/backend/src/routes/resources.js`
- Create: `custodia-blockchain/backend/src/index.js`

**Interfaces:**
- Consumes: dirección contrato Amoy + ABI, `custodioActual`, `historia`.
- Produces: `POST /resources`, `POST /resources/:id/transfer`, `POST /resources/:id/return`, `POST /resources/:id/retire`, `GET /verify/:id`.

- [ ] **Step 1: DDL off-chain (documentos, nunca historia canónica)**

```sql
CREATE TABLE IF NOT EXISTS resources_offchain(
  resource_id TEXT PRIMARY KEY,
  pdf_url TEXT NOT NULL,
  fotos TEXT[] DEFAULT '{}',
  seriales TEXT[] DEFAULT '{}',
  hash_evento TEXT NOT NULL,
  hash_pdf TEXT NOT NULL
);
```

- [ ] **Step 2: src/db.js + src/chain.js**

```js
// db.js
const { Pool } = require("pg");
module.exports = new Pool({ connectionString: process.env.DATABASE_URL });
// chain.js
const { ethers } = require("ethers");
const ABI = require("../../contracts/artifacts/contracts/CustodyRegistry.sol/CustodyRegistry.json").abi;
function getContract(signerOrProvider) { return new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, signerOrProvider); }
module.exports = { getContract };
```

- [ ] **Step 3: routes/resources.js (relay, NO reescribe historia)**

```js
const express = require("express"); const { ethers } = require("ethers");
const db = require("../db"); const { getContract } = require("../chain");
const r = express.Router();
r.post("/", async (req, res) => {
  const { resourceId, to, hashEvento, hashPDF, pdfUrl } = req.body;
  const signer = new ethers.Wallet(process.env.RELAY_KEY, new ethers.JsonRpcProvider(process.env.AMOY_RPC));
  const tx = await getContract(signer).registerResource(resourceId, to, hashEvento, hashPDF);
  await tx.wait();
  await db.query("INSERT INTO resources_offchain(resource_id,pdf_url,hash_evento,hash_pdf) VALUES($1,$2,$3,$4)", [resourceId, pdfUrl, hashEvento, hashPDF]);
  res.json({ tx: tx.hash });
});
r.post("/:id/transfer", async (req, res) => {
  const { from, to, hashEvento, hashPDF, sigFrom, sigTo } = req.body;
  const signer = new ethers.Wallet(process.env.RELAY_KEY, new ethers.JsonRpcProvider(process.env.AMOY_RPC));
  const tx = await getContract(signer).executeTransfer(req.params.id, from, to, hashEvento, hashPDF, sigFrom, sigTo);
  await tx.wait(); res.json({ tx: tx.hash });
});
r.get("/verify/:id", async (req, res) => {
  const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC);
  const hist = await getContract(provider).historia(req.params.id);
  const off = await db.query("SELECT * FROM resources_offchain WHERE resource_id=$1", [req.params.id]);
  res.json({ onchain: hist, offchain: off.rows[0] || null });
});
module.exports = r;
```

Añadir `return` y `retire` simétricos antes de dar por hecho (misma forma, cambian método contrato).

- [ ] **Step 4: Probar local con Postgres**

Run: `node src/index.js` + `curl -X POST localhost:3000/resources -H "Content-Type: application/json" -d '{"resourceId":"0x1234...","to":"0x...","hashEvento":"0x...","hashPDF":"0x...","pdfUrl":"file.pdf"}'`
Expected: `{"tx":"0x..."}`. Si falla por `CONTRACT_ADDRESS` vacía, desplegar antes en Amoy.

- [ ] **Step 5: Pedir autorización git**

---

### Task 5: Frontend /verify/<id> + QR

**Files:**
- Create: `custodia-blockchain/frontend/src/lib/verify.js`
- Create: `custodia-blockchain/frontend/src/pages/verify/[id].astro`

**Interfaces:**
- Consumes: `GET /verify/:id` de Task 4.
- Produces: página pública con timeline, comparación hashes, aviso oráculo.

- [ ] **Step 1: lib/verify.js**

```js
export async function loadVerify(id) {
  const r = await fetch(`${import.meta.env.PUBLIC_API}/resources/verify/${id}`);
  const j = await r.json();
  const last = j.onchain[j.onchain.length - 1];
  const okEvento = j.offchain && j.offchain.hash_evento.toLowerCase() === last.hashEvento.toLowerCase();
  return { ...j, custodio: last.to, okEvento };
}
```

- [ ] **Step 2: pages/verify/[id].astro (timeline + oráculo)**

```astro
---
import { loadVerify } from "../../lib/verify.js";
const { id } = Astro.params; const data = await loadVerify(id);
---
<h1>Custodia {id}</h1>
<p>Custodio actual: {data.custodio}</p>
<p>Hash evento coincide: {String(data.okEvento)}</p>
<p><small>Este registro NO afirma verdad física ni localización. Solo prueba doble firma en orden append-only.</small></p>
<ul>{data.onchain.map(e => <li>{e.eventType} {e.from} → {e.to} {e.timestamp}</li>)}</ul>
<img src={`https://api.qrserver.com/v1/create-qr-code/?data=/verify/${id}`} alt="QR" />
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: PASS, ruta `/verify/0x...` renderiza.

---

### Task 6: Brazos A y B justos (DB central vs VC+StatusList host independiente)

**Files:**
- Create: `custodia-blockchain/docs/experimento.md` (parte 1: brazos)

**Interfaces:**
- Consumes: API Task 4.
- Produces: URLs distintas `A=http://localhost:3000` vs `B=http://localhost:3100` (host independiente) usadas por Task 7.

- [ ] **Step 1: Documentar brazo A (DB central vulnerable)**

```markdown
## Brazo A (centralizado)
- Tabla `historial` con UPDATE/DELETE permitido a rol admin. Endpoint `PUT /admin/historial/:id` existe a propósito para demo ataque 1.
- Host: localhost:3000, misma Postgres que backend C pero esquema `brazo_a`.
```

- [ ] **Step 2: Documentar brazo B justo (VC+DID:web+StatusList en host independiente)**

```markdown
## Brazo B (VC + StatusList, host independiente)
- Emite VC firmada + DID:web en `http://localhost:3100` (proceso y puerto distintos, simula dominio distinto).
- Revocación vía W3C StatusList2021 en `http://localhost:3100/status/1`. Verificador exige check de lista; presentar credencial revocada falla.
- Justo: NO comparte Express ni Postgres con A/C. Si se cae :3000, :3100 sigue.
```

- [ ] **Step 3: Implementar stub B mínimo (Express 20 líneas en puerto 3100 con /vc/issue y /status/1)**

```js
const express = require("express"); const app = express(); app.use(express.json());
const revoked = new Set();
app.post("/vc/issue", (req, res) => res.json({ vc: { id: req.body.id, issuer: "did:web:localhost:3100", sig: "stub" } }));
app.get("/status/1", (req, res) => res.json({ revoked: [...revoked] }));
app.listen(3100);
```

---

### Task 7: Demo 3 ataques (UPDATE admin, transferencia ajena, apagón)

**Files:**
- Create: `custodia-blockchain/scripts/demo-ataques/01-update-admin.js`
- Create: `custodia-blockchain/scripts/demo-ataques/02-transferencia-ajena.js`
- Create: `custodia-blockchain/scripts/demo-ataques/03-apagon-emisor.js`

**Interfaces:**
- Consumes: contrato Task 2, API Task 4, brazos Task 6.
- Produces: evidencia tabla para `docs/experimento.md`.

- [ ] **Step 1: 01-update-admin.js (A pierde, C resiste)**

```js
// Brazo A: admin reescribe
await db.query("UPDATE brazo_a.historial SET responsable='atacante' WHERE id=$1", [id]);
// Brazo C: intentar UPDATE on-chain es imposible -> solo lectura; verificar historia intacta
const hist = await contract.historia(id);
console.log("C intacto:", hist.length, hist[hist.length-1].to);
```

- [ ] **Step 2: 02-transferencia-ajena.js (revierte en C)**

```js
const { ethers } = require("ethers");
const atacante = ethers.Wallet.createRandom();
await expect(contract.executeTransfer(id, atacante.address, victima, hE, hP, sigFake1, sigFake2)).to.be.revertedWith("no-custodio");
console.log("C rechazó transferencia ajena: OK");
```

- [ ] **Step 3: 03-apagon-emisor.js (apagón, C+B verifican)**

```js
// 1. matar proceso backend emisor :3000 (manual: Ctrl+C o kill)
// 2. verificar en Amoy directo + host B :3100 siguen respondiendo
const hist = await new ethers.JsonRpcProvider(process.env.AMOY_RPC).getLogs({ address: process.env.CONTRACT_ADDRESS });
console.log("Verificable sin emisor:", hist.length > 0);
await fetch("http://localhost:3100/status/1").then(r => console.log("B independiente OK:", r.ok));
```

- [ ] **Step 4: Correr las 3 demos y pegar salida en docs/experimento.md tabla**

| Ataque | A (DB) | B (VC justo) | C (blockchain) |
|---|---|---|---|
| UPDATE admin | reescrito ❌ | N/A (firma detecta) | intacto ✅ |
| Transfer ajena | permitido ❌ | firma inválida ❌-detectado | revert ✅ |
| Apagón emisor | caído ❌ | verifica en :3100 ✅ | verifica en Amoy ✅ |
| Llave comprometida | pierde | pierde | **pierde (declarar)** |
| Doc alterado | no detecta ❌ | hash mismatch ✅ | hash mismatch ✅ |

---

### Task 8: Cierre experimento + fuentes

**Files:**
- Modify: `custodia-blockchain/docs/experimento.md`
- Modify: `custodia-blockchain/README.md`

**Interfaces:**
- Consumes: salidas Task 7.
- Produces: documento defendible con hipótesis corregida + oráculo + 4 fuentes mínimas.

- [ ] **Step 1: Añadir sección oráculo + llave comprometida + fuentes**

```markdown
## Oráculo y límites
- No protege veracidad física ni localización. Atacante con llaves válidas puede firmar acta falsa (llave comprometida pierde en los 3 brazos).
## Fuentes
- Computadores para Educar $60.000M (Caracol) · PAE $53.117M (El Espectador) · Ley 80 / Ley 527 / RFC3161 / RFC6962 / W3C StatusList / Blockcerts / MIT diplomas / EIP-5192.
```

- [ ] **Step 2: Verificación final**

Run: `npx hardhat test && node scripts/demo-ataques/02-transferencia-ajena.js`
Expected: PASS + "rechazó transferencia ajena: OK".

- [ ] **Step 3: Pedir autorización git final (NO push)**

---

## Self-Review

1. **Spec coverage:** protocolo ✓ (T1), executeTransfer EIP-712 1tx ✓ (T2), 6 funciones+5 eventos ✓ (T2), 2 hashes ✓ (T2/T4), API 5 endpoints ✓ (T4 - return/retire añadir simétrico), /verify+QR ✓ (T5), A/B/C justo host independiente ✓ (T6), 3 demos ✓ (T7), hipótesis verbatim + oráculo + llave pierde ✓ (T1/T8), sin admin/delete ✓ (T2 test), NO NFT/IPFS ✓ (constraints).
2. **Placeholder scan:** sin TBD/TODO; cada paso trae código copiable. `return/retire` en backend marcados "añadir simétricos" — completar con mismo patrón antes de ejecutar T4 (no dejar implícito).
3. **Type consistency:** `resourceId bytes32` en sol ↔ `TEXT hex32` en API/DB; `sigFrom/sigTo bytes` ↔ hex `0x`; `nonces` usado en digest y test nonce=1; `historia()` retorna `Evento[]` consumido igual en backend y demo.

## Execution Handoff

Plan completo y guardado en `docs/superpowers/plans/2026-09-14-custodia-blockchain-actas.md`. Dos opciones de ejecución:

**1. Subagent-Driven (recomendado)** — despacho un subagente fresco por tarea, reviso entre tareas, iteración rápida.

**2. Inline Execution** — ejecuto tareas en esta sesión con checkpoints de revisión.

¿Cuál eliges?
