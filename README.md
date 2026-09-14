# Trazabilidad de actas de entrega, recepción y transferencia de recursos públicos mediante un registro blockchain con cadena de custodia y autorización dual

**Pregunta:** ¿En qué medida un registro blockchain append-only con autorización dual reduce la posibilidad de modificación unilateral del historial de custodia frente a una arquitectura centralizada administrada?

**Hipótesis:** Un registro append-only con autorización dual conserva y permite verificar historial ante indisponibilidad del emisor e impide reescritura por admin sin llaves. No protege contra compromiso de llaves ni veracidad física (oráculo).

**Mapa:** `docs/protocolo.md` (formal) · `docs/experimento.md` (3 brazos) · `contracts/CustodyRegistry.sol` (única fuente on-chain) · `GET /verify/:id` (verificación pública).

**Oráculo explícito:** el sistema NO afirma verdad física ni localización. Solo prueba que dos llaves firmaron el mismo hashEvento+hashPDF en un orden append-only.
