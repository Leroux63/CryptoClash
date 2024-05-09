require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks:{
    sepolia:{
      url: process.env.SEPOLIA_URL,
      accounts:[process.env.PRIVATE_KEY]
    },
    sepolia2: {
      url: process.env.SEPOLIA_URL_2,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
