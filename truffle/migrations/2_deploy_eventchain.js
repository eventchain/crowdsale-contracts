var EventChain = artifacts.require("./token/EventChain.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(EventChain);
};
