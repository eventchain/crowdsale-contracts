var EventChain = artifacts.require("./token/EventChain.sol");
var Crowdsale = artifacts.require("./ico/EventChainCrowdsale.sol");

module.exports = function(deployer, network, accounts) {
  var beneficiary, crowdsale, evc;
  beneficiary = accounts[2];
  developer = accounts[3];
  deployer.deploy(Crowdsale, EventChain.address, beneficiary, developer);
};
