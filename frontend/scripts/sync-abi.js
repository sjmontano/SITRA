import { copyFileSync, mkdirSync } from "node:fs";
mkdirSync(new URL("../src/lib/server/", import.meta.url), { recursive: true });
copyFileSync(
  new URL("../../contracts/artifacts/contracts/CustodyRegistry.sol/CustodyRegistry.json", import.meta.url),
  new URL("../src/lib/server/contract-abi.json", import.meta.url)
);
console.log("ABI synced");
