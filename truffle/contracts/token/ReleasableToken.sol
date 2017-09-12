pragma solidity ^0.4.11;


import "./ERC20.sol";
import "../common/Ownable.sol";


/*
 * @title ReleasableToken
 * @dev Token that may not be transfered until it was released.
 */
contract ReleasableToken is ERC20, Ownable {
    address public releaseAgent;
    bool public released = false;

    /**
     * @dev One way function to release the tokens to the wild.
     */
    function releaseToken() public onlyReleaseAgent {
        released = true;
    }

    /**
     * @dev Set the contract that may call the release function.
     */
    function setReleaseAgent(address addr) onlyOwner inReleaseState(false) public {
        releaseAgent = addr;
    }

    function transfer(address _to, uint _value) inReleaseState(true) returns (bool) {
        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint _value) inReleaseState(true) returns (bool) {
        return super.transferFrom(_from, _to, _value);
    }

    /**
     * @dev The function can be called only before or after the tokens have been releasesd
     */
    modifier inReleaseState(bool releaseState) {
        assert(releaseState == released);
        _;
    }

    /**
     * @dev The function can be called only by a whitelisted release agent.
     */
    modifier onlyReleaseAgent() {
        assert(msg.sender == releaseAgent);
        _;
    }
}
