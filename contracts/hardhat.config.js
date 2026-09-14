require("@nomicfoundation/hardhat-toolbox");
module.exports = {
  solidity: { version: "0.8.24", settings: { optimizer: { enabled: true, runs: 200 }, viaIR: true } },
  networks: { amoy: { url: process.env.AMOY_RPC || "", accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [] } }
};
