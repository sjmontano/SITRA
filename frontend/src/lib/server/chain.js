import { ethers } from "ethers";
import ABI from "./contract-abi.json" assert { type: "json" };
export function getContract(signerOrProvider) {
  return new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI.abi, signerOrProvider);
}
export function relaySigner() {
  return new ethers.Wallet(process.env.RELAY_KEY, new ethers.JsonRpcProvider(process.env.AMOY_RPC));
}
