pragma solidity ^0.4.11;


import "./MintableToken.sol";
import "./ReleasableToken.sol";


/**
 * @title EventChain
 * @dev Contract for the EventChain token.
 */
contract EventChain is ReleasableToken, MintableToken {
    string public name = "EventChain";
    string public symbol = "EVC";
    uint8 public decimals = 18;
    
    function EventChain() {
        // total supply is 84 million tokens
        totalSupply = 84000000 ether;
        mintableSupply = totalSupply;
        // allow deployer to unlock token transfer and mint tokens
        setReleaseAgent(msg.sender);
        setMintAgent(msg.sender, true);
    }
}
