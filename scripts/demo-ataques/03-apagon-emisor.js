// Demo 03 — Apagón del emisor: verifica sin backend :3000; B en :3100 sigue.
// Env: hardhat in-process (sin Amoy). NO toca :3000 a proposito (simula caida).
// Ejecutar desde contracts/:
//   npx hardhat run ../scripts/demo-ataques/03-apagon-emisor.js
const { createRequire } = require("module");
const { join } = require("path");
// El script vive fuera de contracts/; resuelve hardhat desde el proyecto contracts.
const req = createRequire(join(__dirname, "..", "..", "contracts", "package.json"));
const { ethers } = req("hardhat");

async function main() {
  // Brazo C autocontenido: despliega + lee historia via provider local
  // (sin pasar por backend/emisor :3000 — caido por hipotesis).
  const [a, b] = await ethers.getSigners();
  const ctr = await (await ethers.getContractFactory("CustodyRegistry")).deploy();
  await ctr.waitForDeployment();
  await ctr.registerInstitution(a.address);
  await ctr.registerInstitution(b.address);
  const id = ethers.keccak256(ethers.toUtf8Bytes("portatil-003"));
  const h = ethers.keccak256(ethers.toUtf8Bytes("h3"));
  await ctr.registerResource(id, a.address, h, h);

  const hist = await ctr.historia(id); // lectura directa, sin emisor
  console.log(`Verificable sin emisor: ${hist.length > 0}`);
  console.log(`C intacto: ${hist.length} ${hist[hist.length - 1].to}`);

  // Brazo B: stub independiente en :3100
  try {
    const r = await fetch("http://localhost:3100/status/1");
    const body = await r.text();
    console.log("B /status/1:", body.slice(0, 200));
    console.log("B independiente OK: true");
  } catch (e) {
    console.log("B independiente OK: false (arranca brazo-b: npm start en brazo-b/)");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
