// Demo 02 — Transferencia ajena: atacante (from != custodio) + firma invalida.
// Env: hardhat in-process (sin Amoy). Ejecutar desde contracts/:
//   npx hardhat run ../scripts/demo-ataques/02-transferencia-ajena.js
const { createRequire } = require("module");
const { join } = require("path");
// El script vive fuera de contracts/; resuelve hardhat desde el proyecto contracts.
const req = createRequire(join(__dirname, "..", "..", "contracts", "package.json"));
const { ethers } = req("hardhat");

async function signTransfer(signer, contract, from, to, id, hE, hP, nonce) {
  return signer.signTypedData(
    { name: "CustodiaActas", version: "1", chainId: 31337, verifyingContract: await contract.getAddress() },
    { Transfer: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "resourceId", type: "bytes32" }, { name: "hashEvento", type: "bytes32" }, { name: "hashPDF", type: "bytes32" }, { name: "nonce", type: "uint256" }] },
    { from, to, resourceId: id, hashEvento: hE, hashPDF: hP, nonce }
  );
}

async function main() {
  const [a, b, atacante] = await ethers.getSigners();
  const ctr = await (await ethers.getContractFactory("CustodyRegistry")).deploy();
  await ctr.waitForDeployment();
  await ctr.registerInstitution(a.address);
  await ctr.registerInstitution(b.address);
  await ctr.registerInstitution(atacante.address);
  const id = ethers.keccak256(ethers.toUtf8Bytes("portatil-002"));
  const h = ethers.keccak256(ethers.toUtf8Bytes("h2"));
  await ctr.registerResource(id, a.address, h, h);
  console.log("custodio:", await ctr.custodioActual(id), "| atacante:", atacante.address);

  // Intento 1: from = atacante (no es custodio)
  const s1 = await signTransfer(atacante, ctr, atacante.address, b.address, id, h, h, 1);
  const s2 = await signTransfer(b, ctr, atacante.address, b.address, id, h, h, 1);
  try {
    await ctr.executeTransfer(id, atacante.address, b.address, h, h, s1, s2);
    console.log("C rechazó transferencia ajena: FALLO (no revirtió)");
  } catch (e) {
    const msg = String(e.message || e);
    console.log("revert capturado (esperado no-custodio):", msg.includes("no-custodio") ? "no-custodio" : msg.slice(0, 120));
    if (msg.includes("no-custodio")) console.log("C rechazó transferencia ajena: OK");
    else console.log("C rechazó transferencia ajena: FALLO (revert inesperado)");
  }

  // Intento 2: from correcto (a->b) pero sigFrom falsificada (firmada por atacante)
  const sigFake = await signTransfer(atacante, ctr, a.address, b.address, id, h, h, 1);
  const sigToOk = await signTransfer(b, ctr, a.address, b.address, id, h, h, 1);
  try {
    await ctr.executeTransfer(id, a.address, b.address, h, h, sigFake, sigToOk);
    console.log("sigFake: FALLO (no revirtió)");
  } catch (e) {
    const msg = String(e.message || e);
    console.log("revert capturado (esperado sigFrom):", msg.includes("sigFrom") ? "sigFrom" : msg.slice(0, 120));
  }
  console.log("custodio final (debe seguir siendo a):", await ctr.custodioActual(id));
}

main().catch((e) => { console.error(e); process.exit(1); });
