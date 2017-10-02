pragma solidity ^0.4.11;


/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {
    function mul(uint256 a, uint256 b) internal constant returns (uint256) {
        uint256 c = a * b;
        assert(a == 0 || c / a == b);
        return c;
    }

    function div(uint256 a, uint256 b) internal constant returns (uint256) {
        // assert(b > 0); // Solidity automatically throws when dividing by 0
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold
        return c;
    }

    function sub(uint256 a, uint256 b) internal constant returns (uint256) {
        assert(b <= a);
        return a - b;
    }

    function add(uint256 a, uint256 b) internal constant returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }
}


/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
    address public owner;

    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    function Ownable() {
        owner = msg.sender;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        assert(msg.sender == owner);
        _;
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) onlyOwner {
        assert(newOwner != address(0));
        owner = newOwner;
    }
}


/*
 * @title Haltable
 * @dev Abstract contract that allows children to implement an emergency stop mechanism.
 * @dev Differs from Pausable by causing a throw when in halt mode.
 */
contract Haltable is Ownable {
    bool public halted;

    modifier stopInEmergency {
        assert(!halted);
        _;
    }

    modifier onlyInEmergency {
        assert(halted);
        _;
    }

    /**
     * @dev Called by the owner on emergency, triggers stopped state.
     */
    function halt() external onlyOwner {
        halted = true;
    }

    /**
     * @dev Called by the owner on end of emergency, returns to normal state.
     */
    function unhalt() external onlyOwner onlyInEmergency {
        halted = false;
    }
}


/**
 * @title ERC20Basic
 * @dev Simpler version of ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/179
 */
contract ERC20Basic {
    uint256 public totalSupply;
    function balanceOf(address who) constant returns (uint256);
    function transfer(address to, uint256 value) returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
}


/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
contract ERC20 is ERC20Basic {
    function allowance(address owner, address spender) constant returns (uint256);
    function transferFrom(address from, address to, uint256 value) returns (bool);
    function approve(address spender, uint256 value) returns (bool);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}


/**
 * @title Basic token
 * @dev Basic version of StandardToken, with no allowances.
 */
contract BasicToken is ERC20Basic {
    using SafeMath for uint256;

    mapping(address => uint256) balances;

    /**
     * @dev transfer token for a specified address
     * @param _to The address to transfer to.
     * @param _value The amount to be transferred.
     */
    function transfer(address _to, uint256 _value) onlyPayloadSize(2 * 32) returns (bool) {
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        Transfer(msg.sender, _to, _value);
        return true;
    }

    /**
     * @dev Gets the balance of the specified address.
     * @param _owner The address to query the the balance of.
     * @return An uint256 representing the amount owned by the passed address.
     */
    function balanceOf(address _owner) constant returns (uint256 balance) {
        return balances[_owner];
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


/**
 * @title Standard ERC20 token
 *
 * @dev Implementation of the basic standard token.
 * @dev https://github.com/ethereum/EIPs/issues/20
 * @dev Based on code by FirstBlood: https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 */
contract StandardToken is ERC20, BasicToken {
    mapping (address => mapping (address => uint256)) allowed;

    /**
     * @dev Transfer tokens from one address to another
     * @param _from address The address which you want to send tokens from
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amout of tokens to be transfered
     */
    function transferFrom(address _from, address _to, uint256 _value) returns (bool) {
        var _allowance = allowed[_from][msg.sender];
        // Check is not needed because sub(_allowance, _value) will already throw if this condition is not met
        // assert (_value <= _allowance);
        balances[_to] = balances[_to].add(_value);
        balances[_from] = balances[_from].sub(_value);
        allowed[_from][msg.sender] = _allowance.sub(_value);
        Transfer(_from, _to, _value);
        return true;
    }

    /**
     * @dev Aprove the passed address to spend the specified amount of tokens on behalf of msg.sender.
     * @param _spender The address which will spend the funds.
     * @param _value The amount of tokens to be spent.
     */
    function approve(address _spender, uint256 _value) returns (bool) {
        // To change the approve amount you first have to reduce the addresses`
        //  allowance to zero by calling `approve(_spender, 0)` if it is not
        //  already 0 to mitigate the race condition described here:
        //  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
        assert((_value == 0) || (allowed[msg.sender][_spender] == 0));

        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    /**
     * @dev Function to check the amount of tokens that an owner allowed to a spender.
     * @param _owner address The address which owns the funds.
     * @param _spender address The address which will spend the funds.
     * @return A uint256 specifing the amount of tokens still available for the spender.
     */
    function allowance(address _owner, address _spender) constant returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }
}


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


/*
 * @title Crowdsale
 * @dev Contract to manage the EVC crowdsale
 * @dev Using assert over assert within the contract in order to generate error opscodes (0xfe), that will properly show up in etherscan
 * @dev The assert error opscode (0xfd) will show up in etherscan after the metropolis release
 * @dev see: https://ethereum.stackexchange.com/a/24185
 */
contract EventChainCrowdsale is Haltable {
    using SafeMath for uint256;

    enum State{Ready, CrowdsaleOpen, CrowdsaleEnded}

    uint256 constant public EXCHANGE_RATE = 800;

    uint256 constant public MIN_INVEST = 10 finney;
    uint256 constant public BTWO_CLAIM_PERCENT = 3;
    uint256 constant public EASTER_EGG_BONUS = 336; // 42 percent of currentRate

    EventChain public evc;
    address public beneficiary;
    address public beneficiaryTwo;
    uint256 public totalRaised;

    State public currentState;
    uint256 public currentRate; 
    uint256 public currentSupply;
    uint256 public currentTotalSupply;

    event StateChanged(State from, State to);
    event FundsClaimed(address receiver, uint256 claim);
    event InvestmentMade(
        address investor,
        uint256 weiAmount,
        uint256 tokenAmount,
        bytes calldata
    );

    function EventChainCrowdsale(EventChain _evc, address _beneficiary, address _beneficiaryTwo) {
        assert(address(_evc) != 0x0);
        assert(address(_beneficiary) != 0x0);
        assert(address(_beneficiaryTwo) != 0x0);

        beneficiary = _beneficiary;
        beneficiaryTwo = _beneficiaryTwo;
        evc = _evc;
    }

    function() payable inState(State.CrowdsaleOpen) stopInEmergency external {
        assert(msg.data.length <= 68); // 64 bytes data limit plus 4 for the prefix
        assert(msg.value >= MIN_INVEST);

        uint256 bestRate = currentRate;
        if (msg.data.length != 0) {
            bestRate = bestRate.add(EASTER_EGG_BONUS);
        }
        uint256 tokens = msg.value.mul(bestRate);
        currentSupply = currentSupply.sub(tokens);
        evc.mint(msg.sender, tokens);
        totalRaised = totalRaised.add(msg.value);

        InvestmentMade(
            msg.sender,
            msg.value,
            tokens,
            msg.data
        );
    }

    function openCrowdsale() onlyOwner inState(State.Ready) stopInEmergency external {
        currentTotalSupply = evc.mintableSupply();
        currentSupply = currentTotalSupply;
        currentRate = EXCHANGE_RATE;
        currentState = State.CrowdsaleOpen;

        StateChanged(State.Ready, currentState);
    }

    function endCrowdsale() onlyOwner inState(State.CrowdsaleOpen) stopInEmergency external {
        claimFunds();

        currentTotalSupply = 0;
        currentSupply = 0;
        currentRate = 0;
        currentState = State.CrowdsaleEnded;

        StateChanged(State.CrowdsaleOpen, currentState);
    }

    function currentStateToString() constant returns (string) {
        if (currentState == State.Ready) {
            return "Ready";
        } else if (currentState == State.CrowdsaleOpen) {
            return "Crowdsale open";
        } else {
            return "Crowdsale ended";
        }
    }

    function claimFunds() internal {
        uint256 beneficiaryTwoClaim = this.balance.div(100).mul(BTWO_CLAIM_PERCENT);
        beneficiaryTwo.transfer(beneficiaryTwoClaim);
        FundsClaimed(beneficiaryTwo, beneficiaryTwoClaim);

        uint256 beneficiaryClaim = this.balance;
        beneficiary.transfer(this.balance);
        FundsClaimed(beneficiary, beneficiaryClaim);
    }

    modifier inState(State _state) {
        assert(currentState == _state);
        _;
    }
}
