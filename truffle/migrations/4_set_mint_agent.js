var EventChain = artifacts.require("./token/EventChain.sol");
var Crowdsale = artifacts.require("./ico/EventChainCrowdsale.sol");

module.exports = function(deployer, network, accounts) {
  EventChain.deployed().then((evc) => {
    return evc.setMintAgent(Crowdsale.address, true);
  });
};
