import { ethers } from "ethers";
export async function signTransfer({ contractAddress, from, to, resourceId, hashEvento, hashPDF, nonce }) {
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const network = await provider.getNetwork();
  return signer.signTypedData(
    { name: "CustodiaActas", version: "1", chainId: Number(network.chainId), verifyingContract: contractAddress },
    { Transfer: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "resourceId", type: "bytes32" }, { name: "hashEvento", type: "bytes32" }, { name: "hashPDF", type: "bytes32" }, { name: "nonce", type: "uint256" }] },
    { from, to, resourceId, hashEvento, hashPDF, nonce }
  );
}
export function sha256Of(obj) {
  const s = typeof obj === "string" ? obj : JSON.stringify(obj);
  return ethers.sha256(ethers.toUtf8Bytes(s));
}
export function sha256OfBytes(u8) {
  return ethers.sha256(u8);
}
// Alias de compatibilidad (antes keccak). Ahora SHA-256 como en clase.
export const keccakOf = sha256Of;
export const keccakOfBytes = sha256OfBytes;
export function buildActaCanonica({ item, entrega, fecha, responsable_entrega, responsable_recibe, estado_acta }) {
  return JSON.stringify({ detalle: item, entrega, estado_acta: estado_acta || "ENTREGA", fecha, item: item.split("·")[0].trim(), observaciones: "", responsable_entrega: responsable_entrega || "Secretaría", responsable_recibe: responsable_recibe || "Institución A" });
}
