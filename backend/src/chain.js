const { ethers } = require("ethers");
const ABI = require("../../contracts/artifacts/contracts/CustodyRegistry.sol/CustodyRegistry.json").abi;
function getContract(signerOrProvider) { return new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, signerOrProvider); }
module.exports = { getContract };
