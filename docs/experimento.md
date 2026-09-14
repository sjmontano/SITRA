# Experimento 3 brazos

**Hipótesis:** Un registro append-only con autorización dual conserva y permite verificar historial ante indisponibilidad del emisor e impide reescritura por admin sin llaves. No protege contra compromiso de llaves ni veracidad física (oráculo).

## Brazo A (centralizado)
- Tabla `historial` con UPDATE/DELETE permitido a rol admin. Endpoint `PUT /admin/historial/:id` existe a propósito para demo ataque 1.
- Host: localhost:3000, misma Postgres que backend C pero esquema `brazo_a`.

## Brazo B (VC + StatusList, host independiente)
- Emite VC firmada + DID:web en `http://localhost:3100` (proceso y puerto distintos, simula dominio distinto).
- Revocación vía W3C StatusList2021 en `http://localhost:3100/status/1`. Verificador exige check de lista; presentar credencial revocada falla.
- Justo: NO comparte Express ni Postgres con A/C. Si se cae :3000, :3100 sigue.

## Resultados (Task 7 pega salidas)

Entorno: hardhat local; Amoy en despliegue real.

| Ataque | A (DB) | B (VC justo) | C (blockchain) |
|---|---|---|---|
| UPDATE admin | reescrito ❌ | N/A (firma detecta) | intacto ✅ |
| Transfer ajena | permitido ❌ | firma inválida ❌-detectado | revert ✅ |
| Apagón emisor | caído ❌ | verifica en :3100 ✅ | verifica en Amoy ✅ |
| Llave comprometida | pierde | pierde | **pierde (declarar)** |
| Doc alterado | no detecta ❌ | hash mismatch ✅ | hash mismatch ✅ |

Evidencia (salidas reales, hardhat local):

```text
# 01-update-admin.js — npx hardhat run ../scripts/demo-ataques/01-update-admin.js (desde contracts/)
A ANTES: [{"id":1,"responsable":"inst-a","evento":"entrega"}]
A DESPUÉS: [{"id":1,"responsable":"atacante","evento":"entrega"}]
A reescrito
C sin funcion update/delete: OK
C intacto: 1 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

```text
# 02-transferencia-ajena.js — npx hardhat run ../scripts/demo-ataques/02-transferencia-ajena.js (desde contracts/)
custodio: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | atacante: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
revert capturado (esperado no-custodio): no-custodio
C rechazó transferencia ajena: OK
revert capturado (esperado sigFrom): sigFrom
custodio final (debe seguir siendo a): 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

```text
# 03-apagon-emisor.js — npx hardhat run ../scripts/demo-ataques/03-apagon-emisor.js (desde contracts/, stub brazo-b en :3100)
Verificable sin emisor: true
C intacto: 1 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
B /status/1: {"revoked":[]}
B independiente OK: true
```

Amoy/Postgres reales pendientes de despliegue (sin credenciales en sandbox).
## Oráculo y límites
- No protege veracidad física ni localización. Atacante con llaves válidas puede firmar acta falsa (llave comprometida pierde en los 3 brazos).
## Fuentes
- Computadores para Educar $60.000M (Caracol) · PAE $53.117M (El Espectador) · Ley 80 / Ley 527 / RFC3161 / RFC6962 / W3C StatusList / Blockcerts / MIT diplomas / EIP-5192.
