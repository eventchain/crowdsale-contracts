# EventChain ICO Contracts

## Executing the ICO

The following steps cover the ico execution from deployment to finalization.  
When deploying via truffle on a network, the steps: "*Deploy*" and "*Prepare*" will be taken care of by the migrations.

* Deploy *(use compiler version 0.4.16+commit.d7661dd9 with optimization enabled)*
  * **token** contract
  * **crowdsale** contract passing along the ```token address```, ```beneficiary address``` and ```beneficiaryTwo address```
* Prepare
  * call ```setMintAgent(crowdSaleAddress, true)``` on the **token** contract
* Start
  * call ```openCrowdsale``` on the **crowdsale** contract
* Finalize
  * call ```endCrowdsale``` on the **crowdsale** contract
  * call ```releaseToken``` on the **token** contract
  * call ```setMintAgent(crowdSaleAddress, false)``` on the **token** contract
  * call ```setMintAgent(deployerAddress, false)``` on the **token** contract
  * call ```transferOwnership(newOwner)``` on the **crowdsale** and **token** contracts

Notice: The *deployer* (msg.sender) will be set as the *owner* of both the **token** and the **crowdsale** contract.

## Development

### Setup
* Clone: ```git clone git@github.com:eventchain/crowdsale-contracts.git```
* Start containers: ```docker-compose up -d```
* Run yarn install from inside node container: ```bin/install```

### Truffle
* Run truffle on testrpc: ```./bin/truffle console```
* Run truffle on rinkeby testnet: ```./bin/truffle console --network rinkeby```

Commands examples inside the truffle console:

```
> web3.eth.getBalance(web3.eth.accounts[0]).toString(10)
> compile
> migrate
> test
> .exit
```

### Code analysis
* Solcover (contract code-coverage): ```bin/coverage```
* Solium (contract linting):```bin/lint```
* Eslint (test linting):```bin/eslint```
