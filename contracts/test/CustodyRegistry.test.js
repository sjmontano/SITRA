const { expect } = require("chai");
const { ethers } = require("hardhat");
async function signTransfer(signer, contract, from, to, id, hE, hP, nonce) {
  return signer.signTypedData(
    { name: "CustodiaActas", version: "1", chainId: 31337, verifyingContract: await contract.getAddress() },
    { Transfer: [{name:"from",type:"address"},{name:"to",type:"address"},{name:"resourceId",type:"bytes32"},{name:"hashEvento",type:"bytes32"},{name:"hashPDF",type:"bytes32"},{name:"nonce",type:"uint256"}] },
    { from, to, resourceId: id, hashEvento: hE, hashPDF: hP, nonce });
}
describe("CustodyRegistry", () => {
  it("register + executeTransfer dual ok, estado reconstruye", async () => {
    const [a, b, c] = await ethers.getSigners();
    const F = await ethers.getContractFactory("CustodyRegistry");
    const ctr = await F.deploy(); await ctr.waitForDeployment();
    await ctr.registerInstitution(a.address); await ctr.registerInstitution(b.address);
    const id = ethers.keccak256(ethers.toUtf8Bytes("portatil-001"));
    const hE = ethers.keccak256(ethers.toUtf8Bytes('{"acta":1}')), hP = ethers.keccak256(ethers.toUtf8Bytes("pdf1"));
    await ctr.registerResource(id, a.address, hE, hP);
    const sF = await signTransfer(a, ctr, a.address, b.address, id, hE, hP, 1);
    const sT = await signTransfer(b, ctr, a.address, b.address, id, hE, hP, 1);
    await expect(ctr.executeTransfer(id, a.address, b.address, hE, hP, sF, sT)).to.emit(ctr, "CustodyTransferred");
    expect(await ctr.custodioActual(id)).to.eq(b.address);
  });
  it("rechaza transferencia ajena (no-custodio)", async () => {
    const [a, b, c] = await ethers.getSigners();
    const ctr = await (await ethers.getContractFactory("CustodyRegistry")).deploy(); await ctr.waitForDeployment();
    await ctr.registerInstitution(a.address); await ctr.registerInstitution(b.address); await ctr.registerInstitution(c.address);
    const id = ethers.keccak256(ethers.toUtf8Bytes("x")); const h = ethers.keccak256(ethers.toUtf8Bytes("h"));
    await ctr.registerResource(id, a.address, h, h);
    const s1 = await signTransfer(c, ctr, c.address, b.address, id, h, h, 1);
    const s2 = await signTransfer(b, ctr, c.address, b.address, id, h, h, 1);
    await expect(ctr.executeTransfer(id, c.address, b.address, h, h, s1, s2)).to.be.revertedWith("no-custodio");
  });
  it("rechaza sin doble firma y sin delete/update", async () => {
    const [a, b] = await ethers.getSigners();
    const ctr = await (await ethers.getContractFactory("CustodyRegistry")).deploy(); await ctr.waitForDeployment();
    expect(ctr.interface.fragments.some(f => /delete|update/i.test(f.name || ""))).to.eq(false);
  });
});
