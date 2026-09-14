# Deploy SITRA nube gratis

## 1. Supabase
- Crea proyecto gratis, copia `DATABASE_URL` pooler (puerto 6543) + `DIRECT_URL` (5432).
- Ejecuta `backend/sql/01_offchain.sql` en el SQL editor (crea `resources_offchain`; crea esquema `brazo_a` si se usa brazo A).

## 2. Contrato Amoy
- Faucet Amoy para `DEPLOYER_KEY`. `cd contracts && AMOY_RPC=... DEPLOYER_KEY=... SEED_A=0x.. SEED_B=0x.. npx hardhat run scripts/deploy.js --network amoy`.
- Guarda `CONTRACT_ADDRESS`.
- La dirección de RELAY_KEY debe estar registrada como institución (úsala como SEED_A o SEED_B, o llama registerInstitution con ella); si no, todas las escrituras revierten con "no-inst".

## 3. Vercel proyecto A (dApp+API)
- Importa `sjmontano/SITRA`, Root Directory `frontend`, framework Astro.
- Env: `DATABASE_URL` (pooler), `AMOY_RPC`, `CONTRACT_ADDRESS`, `RELAY_KEY` (secreto), `PUBLIC_CONTRACT_ADDRESS` (= CONTRACT_ADDRESS, pública on-chain).
- Deploy. Rutas: `/`, `/registrar`, `/transferir/:id`, `/verify/:id`, `/api/*`.

## 4. Vercel proyecto B (brazo-b)
- Importa mismo repo, Root Directory `brazo-b`. Sin env. Anota su URL para la tabla del experimento.
- Nota: /status/1 es stub sin estado (revoked siempre []); demuestra independencia de host, no revocación real.

## 5. Verificar
- `GET /api/resources/verify/<id>` responde `{onchain, offchain}`.
- MetaMask en Amoy (chainId 80002) para operar.
