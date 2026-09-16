<div align="center">

# ⛓️ SITRA

### Sistema de Trazabilidad de Recursos

**Registro blockchain append-only con autorización dual para actas de entrega, recepción y transferencia de recursos públicos**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?style=flat-square&logo=solidity)](contracts/contracts/CustodyRegistry.sol)
[![Polygon Amoy](https://img.shields.io/badge/Polygon-Amoy_80002-7B3FE4?style=flat-square&logo=polygon)](https://amoy.polygonscan.com)
[![EIP-712](https://img.shields.io/badge/Firmas-EIP--712-2ea043?style=flat-square)](docs/protocolo.md)
[![Astro](https://img.shields.io/badge/Frontend-Astro_4-FF5D01?style=flat-square&logo=astro)](frontend/)
[![Supabase](https://img.shields.io/badge/DB-Supabase_Postgres-3ECF8E?style=flat-square&logo=supabase)](backend/sql/01_offchain.sql)
[![Hardhat](https://img.shields.io/badge/Tests-Hardhat-FFF100?style=flat-square&logo=data:image/svg+xml;base64,PHN2Zz48L3N2Zz4)](contracts/test/CustodyRegistry.test.js)

*Proyecto académico — Sistemas Distribuidos · Colegio Mayor del Cauca*

[Qué es](#-qué-es-sitra) · [Demo](#-ejemplo-de-la-vida-real) · [Arquitectura](#️-arquitectura) · [Inicio rápido](#-inicio-rápido) · [Experimento](#-experimento-3-brazos) · [API](#-api) · [Documentación](#-documentación)

</div>

---

## 📌 Qué es SITRA

Los recursos públicos —computadores, mobiliario, equipos— pasan de una Secretaría a una institución educativa y luego a otra. Cada movimiento genera un acta… que hoy vive en una base de datos donde **un único administrador puede editar o borrar el historial**.

SITRA cambia la regla del juego: cada entrega y transferencia se firma por **las dos partes** y se ancla en blockchain en un registro **append-only** (solo se agrega, nunca se edita ni se borra). Ninguna entidad, por sí sola, puede reescribir la historia.

> **La idea no es usar blockchain “porque es moderna”**, sino porque varias entidades necesitan compartir un historial sin depender de que un único administrador tenga el poder de modificarlo.

### 🔬 Pregunta de investigación

> ¿En qué medida un registro blockchain append-only con autorización dual reduce la posibilidad de modificación unilateral del historial de custodia frente a una arquitectura centralizada administrada?

### 🧪 Hipótesis

Un registro append-only con autorización dual **conserva y permite verificar el historial** ante indisponibilidad del emisor e **impide la reescritura por un admin sin llaves**. No protege contra compromiso de llaves ni contra la veracidad física (problema del oráculo).

---

## 💻 Ejemplo de la vida real

```
COMP-001 · Computador portátil

  SECRETARÍA
      │  10 SEP · ENTREGA · acta firmada ✍️✍️
      ▼  hashEvento + hashPDF → blockchain
  INSTITUCIÓN A
      │  14 SEP · TRANSFERENCIA · doble firma ✍️✍️
      ▼  from == custodioActual ✓ · nonce+1 ✓
  INSTITUCIÓN B  ← custodio actual
```

Si un administrador intenta cambiar “Recibido por: Institución A” → “Institución B”:

| En una BD centralizada | En SITRA |
|---|---|
| El registro original **desaparece** ❌ | El evento original **permanece** ✅ |
| Nadie puede probar qué decía antes | La corrección es un **evento nuevo**, no un borrado |

---

## ✨ Características

- **🔏 Autorización dual atómica** — `executeTransfer` exige `sigFrom + sigTo` sobre el mismo digest EIP-712 en una sola transacción (sin bloqueos de 2 pasos).
- **📜 Registro append-only** — el contrato no tiene funciones `update`/`delete`; corregir es agregar eventos (`DEVUELTO`, `BAJA`).
- **🔍 Verificación pública** — `GET /verify/:id` compara huellas on-chain vs Supabase y genera **QR** para actas físicas.
- **🧾 Doble huella** — `hashEvento = SHA-256(acta canónica)` + `hashPDF = SHA-256(bytes PDF)`; cualquier alteración se detecta.
- **🔄 Gobernanza sin super-admin** — rotación de llaves institucionales exige firma de la llave anterior **y** la nueva.
- **🧪 Experimento reproducible** — 3 brazos comparables (centralizado / VC + StatusList / blockchain) con scripts demo.

---

## 🏗️ Arquitectura

```
                        SITRA
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
       Supabase                    Blockchain (Amoy)
   datos operativos              historial verificable
   usuarios · actas · PDFs       id · tipo · from · to
   metadatos · consultas         fecha · hashes · firmas
            │                           │
            └─────────────┬─────────────┘
                          ▼
                   Usuario / Verificador
              GET /verify/:id + QR del acta
```

### Qué vive dónde

| ⛓️ On-chain (`CustodyRegistry`) | 🗄️ Off-chain (Supabase/Postgres) |
|---|---|
| ID del recurso, tipo de evento | Usuarios e instituciones |
| Origen, destino, fecha/hora | Actas completas y PDFs |
| `hashEvento` + `hashPDF` + firmas | Metadatos y consultas operativas |

> **Principio:** en blockchain solo huellas y firmas para probar integridad; los documentos viven off-chain.

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|---|---|
| Contrato | Solidity `0.8.24`, OpenZeppelin (EIP-712, ECDSA) |
| Red | Polygon Amoy (testnet, chainId `80002`) · Hardhat local (`31337`) para tests |
| Firmas | EIP-712 `CustodiaActas v1` · ethers.js `v6` |
| Backend/API | Node + Express (`backend/`) / rutas serverless Astro (`frontend/src/pages/api/`) |
| Base de datos | Supabase / PostgreSQL (`resources_offchain`) |
| Frontend | Astro `4` + HTML/CSS/vanilla JS, dApp con MetaMask, QR server-side (`qrcode`) |
| Brazo B | VC + W3C StatusList2021 en servicio independiente (`brazo-b/`, Vercel) |
| Deploy | Vercel (frontend + brazo-b), Supabase (DB) |

---

## 📁 Estructura del repositorio

```
SITRA/
├── contracts/                  # Contrato inteligente (Hardhat)
│   ├── contracts/CustodyRegistry.sol   # ← única fuente on-chain
│   ├── test/CustodyRegistry.test.js    # 3 tests: dual ok, rechaza ajena, sin update/delete
│   └── scripts/deploy.js               # Deploy a Amoy + seed de instituciones
├── backend/                    # API Express (alternativa standalone)
│   ├── src/index.js            # GET /verify/:id redirige a /resources/verify/:id
│   ├── src/routes/resources.js # registrar · transfer · return · retire · verify
│   └── sql/01_offchain.sql     # Tabla resources_offchain
├── frontend/                   # dApp Astro (UI + API serverless)
│   ├── src/pages/              # / · /registrar · /verify/[id] · /transferir/[id]
│   ├── src/pages/api/resources/# POST / · /:id/transfer|return|retire · /verify/:id
│   ├── src/lib/                # transfer-sign.js (EIP-712) · verify.js · server/
│   ├── public/                 # styles.css · main.js (video-background + dot-matrix)
│   └── scripts/sync-abi.js     # Copia el ABI compilado al frontend
├── brazo-b/                    # Brazo B: VC + StatusList2021 (host independiente)
├── scripts/demo-ataques/       # Demos reproducibles del experimento
│   ├── 01-update-admin.js      # UPDATE admin: DB reescribible vs append-only
│   ├── 02-transferencia-ajena.js # from != custodio + firma falsificada → revert
│   └── 03-apagon-emisor.js     # Verificación sin emisor + StatusList en :3100
└── docs/
    ├── protocolo.md            # Protocolo formal (EIP-712 domain, reglas, estados)
    ├── experimento.md          # Experimento 3 brazos + resultados
    ├── DESIGN.md               # Tokens de diseño
    └── DEPLOY.md               # Guía de despliegue gratis (Supabase + Vercel + Amoy)
```

---

## 🚀 Inicio rápido

### Prerrequisitos

- Node.js `20.x` · MetaMask (para operar la dApp) · MATIC de faucet Amoy (para red real)

### 1️⃣ Probar el contrato en local (2 min, sin internet)

```powershell
cd contracts
npm install
npx hardhat test
# 3 passing: dual ok · rechaza ajena · sin update/delete
```

### 2️⃣ Reproducir los ataques del experimento

```powershell
cd contracts
npx hardhat run ../scripts/demo-ataques/01-update-admin.js
# A reescrito  vs  C intacto: 1 0x...

npx hardhat run ../scripts/demo-ataques/02-transferencia-ajena.js
# revert no-custodio · revert sigFrom · custodio final sigue siendo a

npx hardhat run ../scripts/demo-ataques/03-apagon-emisor.js
# Verificable sin emisor: true
```

### 3️⃣ Correr la dApp

```powershell
cd frontend
npm install
npm run sync:abi   # copia el ABI compilado (requiere npx hardhat compile en contracts/)
npm run dev        # http://localhost:4321
```

> Sin variables de entorno, `/registrar` valida y calcula hashes en el navegador pero el anclaje requiere la configuración de [Despliegue](#-despliegue). Para una prueba completa sin blockchain, usa **Rellenar ejemplo** y observa el preview de `hashEvento`.

---

## 🌐 Despliegue

Variables de entorno (`frontend/.env`, ver `.env.example` en `backend/`):

| Variable | Descripción |
|---|---|
| `AMOY_RPC` | RPC de Polygon Amoy |
| `CONTRACT_ADDRESS` | Dirección del `CustodyRegistry` desplegado |
| `PUBLIC_CONTRACT_ADDRESS` | Igual a la anterior (pública, para firmar EIP-712) |
| `RELAY_KEY` | Llave del relayer (debe estar registrada como institución) |
| `DATABASE_URL` | Pooler Supabase (puerto `6543`) |

```powershell
# 1. Contrato en Amoy + seed de instituciones
cd contracts
$env:AMOY_RPC="https://rpc-amoy.polygon.technology"
$env:DEPLOYER_KEY="0x..."
$env:SEED_A="0x..."   # dirección del RELAY_KEY (o una institución)
$env:SEED_B="0x..."
npx hardhat run scripts/deploy.js --network amoy

# 2. DB: ejecuta backend/sql/01_offchain.sql en el SQL editor de Supabase

# 3. Vercel: importa el repo dos veces —
#    proyecto A con Root Directory `frontend` (+ env de arriba)
#    proyecto B con Root Directory `brazo-b` (sin env)
```

Detalle paso a paso en [`docs/DEPLOY.md`](docs/DEPLOY.md).

### 🧭 Flujo end-to-end (Amoy + MetaMask en chainId `80002`)

1. **Registrar** en `/registrar` (ej. COMP-001) → copia el `resourceId`.
2. **Verificar** en `/verify/:id` → insignias ✅✅, 1 evento, QR escaneable.
3. **Transferir** en `/transferir/:id` → firma el emisor (1), el receptor abre la URL y firma (2), se envía la transferencia dual.
4. Volver a **verificar** → 2 eventos, custodio = B, historial anterior intacto.

---

## 🔌 API

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/resources` | Registra recurso (`resourceId, to, hashEvento, hashPDF, pdfUrl`) → `tx` |
| `POST` | `/api/resources/:id/transfer` | Transfiere con doble firma (`from, to, hashEvento, hashPDF, sigFrom, sigTo`) → `tx` |
| `POST` | `/api/resources/:id/return` | Devuelve al custodio actual → `tx` |
| `POST` | `/api/resources/:id/retire` | Da de baja con doble firma (`sigCust, sigInst`) → `tx` |
| `GET` | `/api/resources/verify/:id` | Devuelve `{ onchain, offchain }` para verificación pública |

---

## 📜 Contrato `CustodyRegistry`

Dominio EIP-712: `name: CustodiaActas`, `version: 1`, `chainId: 80002`, `verifyingContract: <desplegada>`.
Tipo firmado: `Transfer(address from, address to, bytes32 resourceId, bytes32 hashEvento, bytes32 hashPDF, uint256 nonce)`.

| Función | Regla |
|---|---|
| `registerInstitution(addr)` | Registra una institución (emite `InstitutionRegistered`) |
| `rotateInstitutionKey(old, new, sigOld, sigNew)` | Rota llave solo con doble firma (sin super-admin) |
| `registerResource(id, to, hE, hP)` | Crea el recurso en `DISPONIBLE`; solo institución |
| `executeTransfer(id, from, to, hE, hP, sigFrom, sigTo)` | Requiere `from == custodioActual`, doble firma válida y `nonce = anterior + 1`; una sola tx |
| `returnResource(id, hE)` | Devuelve; solo el custodio actual |
| `retireResource(id, hE, sigCust, sigInst)` | Baja con doble firma (custodio + institución) |
| `historia(id)` | Vista: lista ordenada de eventos (el último = estado actual) |

Estados: `DISPONIBLE · ENTREGADO · RECIBIDO · EN_CUSTODIA · TRANSFERIDO · DEVUELTO · BAJA`.

---

## 🧪 Experimento: 3 brazos

| Ataque | A · Centralizado | B · VC + StatusList | C · Blockchain |
|---|---|---|---|
| UPDATE de admin | reescrito ❌ | firma lo detecta | intacto ✅ |
| Transferencia ajena | permitido ❌ | firma inválida | `revert` ✅ |
| Apagón del emisor | caído ❌ | verifica en `:3100` ✅ | verifica en Amoy ✅ |
| Documento alterado | no detecta ❌ | `hash mismatch` ✅ | `hash mismatch` ✅ |
| Llave comprometida | pierde | pierde | **pierde (declarado)** |

Salidas reales y metodología en [`docs/experimento.md`](docs/experimento.md). Fuentes del problema: Computadores para Educar ($60.000M), PAE ($53.117M); marco: Ley 80, Ley 527, RFC 3161, RFC 6962, W3C StatusList, Blockcerts, EIP-5192.

---

## ⚠️ Límites honestos (qué NO garantiza)

- **No prueba existencia física** ni localización del recurso (problema del oráculo).
- **No evita colusión**: dos llaves válidas pueden firmar un acta falsa; la cadena la conservará perfectamente.
- **Compromiso de llaves** rompe los 3 brazos por igual (declarado en la hipótesis).
- El alcance correcto es: **integridad y trazabilidad del registro de custodia**, no verdad física.

> Alcance y supuestos formales en [`docs/protocolo.md`](docs/protocolo.md).

---

## 🗺️ Roadmap

- [ ] Cerrar `registerInstitution` con allowlist inicial (hoy es permisiva).
- [ ] Verificación automática total en `/verify` (recomputar hashes + validar firmas EIP-712 off-chain).
- [ ] Bloquear transferencias tras `DEVUELTO`/`BAJA` e incrementar nonce en `retire`.
- [ ] Revocación real en brazo B (hoy `/status/1` es stub) y esquema `brazo_a` en Postgres.
- [ ] Paginación de `historia()` para custodias largas.

---

## 📚 Documentación

- [`docs/protocolo.md`](docs/protocolo.md) — protocolo formal congelado.
- [`docs/experimento.md`](docs/experimento.md) — experimento, resultados y evidencias.
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — despliegue gratis paso a paso.
- [`docs/DESIGN.md`](docs/DESIGN.md) — tokens de diseño del frontend.

---

## 🤝 Contribuir

1. Haz fork y crea una rama (`git checkout -b feat/mi-cambio`).
2. Corre `npx hardhat test` en `contracts/` y `npm run build` en `frontend/`.
3. Abre un PR describiendo el cambio y la evidencia (salida de tests o tx en Amoy).

---

<div align="center">

**SITRA** · Trazabilidad de actas con cadena de custodia y autorización dual

*Secretaría → Institución A → Institución B · cero reescritura.*

</div>
