// Demo 01 — UPDATE admin: brazo A (DB reescribible) vs brazo C (append-only).
// Env: hardhat in-process (sin Amoy). Ejecutar desde contracts/:
//   npx hardhat run ../scripts/demo-ataques/01-update-admin.js
const { createRequire } = require("module");
const { join } = require("path");
// El script vive fuera de contracts/; resuelve hardhat desde el proyecto contracts.
const req = createRequire(join(__dirname, "..", "..", "contracts", "package.json"));
const { ethers } = req("hardhat");

async function main() {
  // --- Brazo A: array JS mutable + rol admin ---
  const historialA = [{ id: 1, responsable: "inst-a", evento: "entrega" }];
  console.log("A ANTES:", JSON.stringify(historialA));
  const rol = "admin";
  if (rol === "admin") historialA[0].responsable = "atacante"; // UPDATE privilegiado
  console.log("A DESPUÉS:", JSON.stringify(historialA));
  console.log("A reescrito");

  // --- Brazo C: CustodyRegistry append-only ---
  const [a, b] = await ethers.getSigners();
  const ctr = await (await ethers.getContractFactory("CustodyRegistry")).deploy();
  await ctr.waitForDeployment();
  await ctr.registerInstitution(a.address);
  await ctr.registerInstitution(b.address);
  const id = ethers.keccak256(ethers.toUtf8Bytes("portatil-001"));
  const hE = ethers.keccak256(ethers.toUtf8Bytes('{"acta":1}'));
  const hP = ethers.keccak256(ethers.toUtf8Bytes("pdf1"));
  await ctr.registerResource(id, a.address, hE, hP);

  const hist = await ctr.historia(id);
  const hayEscritura = ctr.interface.fragments.some(
    (f) => /update|delete/i.test(f.name || "")
  );
  console.log("C sin funcion update/delete:", !hayEscritura ? "OK" : "FALLO");
  console.log(`C intacto: ${hist.length} ${hist[hist.length - 1].to}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
