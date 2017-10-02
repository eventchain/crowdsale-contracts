require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: process.env.RPC_HOST || "localhost",
      port: 8545,
      network_id: "*"
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
