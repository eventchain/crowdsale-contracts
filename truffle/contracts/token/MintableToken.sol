pragma solidity ^0.4.11;


import "./ERC20.sol";
import "./StandardToken.sol";
import "../common/Ownable.sol";
import "../common/SafeMath.sol";


/**
 * @title MintableToken
 * @dev Token that can be minted by another contract until the defined cap is reached.
 * @dev Based on https://github.com/TokenMarketNet/ico/blob/master/contracts/MintableToken.sol
 */
contract MintableToken is StandardToken, Ownable {
    using SafeMath for uint;

    uint256 public mintableSupply;

    /**
     * @dev List of agents that are allowed to create new tokens
     */
    mapping(address => bool) public mintAgents;

    event MintingAgentChanged(address addr, bool state);

    /**
     * @dev Mint token from pool of mintable tokens.
     * @dev Only callable by the mint-agent.
     */
    function mint(address receiver, uint256 amount) onlyPayloadSize(2 * 32) onlyMintAgent canMint public {
        mintableSupply = mintableSupply.sub(amount);
        balances[receiver] = balances[receiver].add(amount);
        // This will make the mint transaction appear in EtherScan.io
        // We can remove this after there is a standardized minting event
        Transfer(0, receiver, amount);
    }

    /**
     * @dev Owner can allow a crowdsale contract to mint new tokens.
     */
    function setMintAgent(address addr, bool state) onlyOwner canMint public {
        mintAgents[addr] = state;
        MintingAgentChanged(addr, state);
    }

    modifier onlyMintAgent() {
        // Only the mint-agent is allowed to mint new tokens
        assert (mintAgents[msg.sender]);
        _;
    }

    /**
     * @dev Make sure we are not done yet.
     */
    modifier canMint() {
        assert(mintableSupply > 0);
        _;
    }

    /**
     * @dev Fix for the ERC20 short address attack
     * @dev see: http://vessenes.com/the-erc20-short-address-attack-explained/
     * @dev see: https://www.reddit.com/r/ethereum/comments/63s917/worrysome_bug_exploit_with_erc20_token/dfwmhc3/
     */
    modifier onlyPayloadSize(uint size) {
        assert (msg.data.length >= size + 4);
        _;
    }
}
