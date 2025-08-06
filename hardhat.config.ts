import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
import "@xyrusworx/hardhat-solidity-json";
require('hardhat-deploy')
require('@openzeppelin/hardhat-upgrades');

import dotenv from "dotenv";
dotenv.config({ path: __dirname + '/.env' });

const { staging_key } = process.env;
const testnetURL = "https://k8s.testnet.json-rpc.injective.network";
const config: HardhatUserConfig = {
  networks: {
    testnet: {
      url: testnetURL,
      accounts: [...(staging_key ? [staging_key] : [])]
    },
    hardhat: {
      chainId: 100,
      accounts: [
        ...(staging_key ? [{privateKey: staging_key, balance: '10000000000000000000000'}] : []),
      ],
      blockGasLimit: 8000000
    }
  },

  etherscan: {
    apiKey: {
      'testnet': 'empty'
    },
    customChains: [
      {
        network: "testnet",
        chainId: 1439,
        urls: {
          apiURL: "https://testnet.blockscout-api.injective.network/api",
          browserURL: "https://testnet.blockscout.injective.network"
        }
      }
    ]
  },

  solidity: {
    version: "0.8.30",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
    },
  },
};

export default config;
