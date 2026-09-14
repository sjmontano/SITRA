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
