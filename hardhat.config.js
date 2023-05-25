require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: { yul: false }
      },
    },
  },
  networks: {
    localganache: {
      url: process.env.PROVIDER_URL,
      accounts: [
        process.env.PRIVATE_KEY_0,
        process.env.PRIVATE_KEY_1,
        process.env.PRIVATE_KEY_2,
        process.env.PRIVATE_KEY_3,
        process.env.PRIVATE_KEY_4,
        process.env.PRIVATE_KEY_5,
        process.env.PRIVATE_KEY_6,
        process.env.PRIVATE_KEY_7,
        process.env.PRIVATE_KEY_8,
        process.env.PRIVATE_KEY_9,
      ]
    }
  },
  allowUnlimitedContractSize: true
}
