const { ethers } = require("hardhat");
async function main() {
  const F = await ethers.getContractFactory("CustodyRegistry");
  const ctr = await F.deploy();
  await ctr.waitForDeployment();
  const addr = await ctr.getAddress();
  console.log(`CustodyRegistry: ${addr}`);
  for (const k of ["SEED_A", "SEED_B"]) {
    const a = process.env[k];
    if (!a) { console.log(`skip ${k}`); continue; }
    const tx = await ctr.registerInstitution(a);
    await tx.wait();
    console.log(`institucion ${k}=${a} tx=${tx.hash}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
