pragma solidity ^0.4.11;


import "../token/EventChain.sol";
import "../common/Haltable.sol";
import "../common/SafeMath.sol";


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
