require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: process.env.RPC_HOST || "localhost",
      port: 8545,
      network_id: '*'
    },
    rinkeby: {
      host: process.env.TESTNET_HOST || "localhost",
      port: 8545,
      network_id: 4,
      gas: 4612388
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01
    }
  }
};
