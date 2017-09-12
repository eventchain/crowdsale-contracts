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

    enum State{Ready, Phase1, Phase2, Phase3, CrowdsaleEnded}

    uint256 constant public PHASE2_SUPPLY = 21000000 ether;
    uint256 constant public PHASE3_SUPPLY = 22600000 ether;

    uint256 constant public PHASE1_RATE = 1140;
    uint256 constant public PHASE2_RATE = 920;
    uint256 constant public PHASE3_RATE = 800;

    uint256 constant public MIN_INVEST = 10 finney;
    uint256 constant public BTWO_CLAIM_PERCENT = 3;

    EventChain public evc;
    address public beneficiary;
    address public beneficiaryTwo;
    uint256 public totalRaised;

    State public currentState;
    uint256 public currentRate; 
    uint256 public currentSupply;
    uint256 public currentTotalSupply;

    event StateChanged(State from, State to);
    event FundsClaimed(address receiver, uint256 claim, string crowdsalePhase);
    event InvestmentMade(
        address investor,
        uint256 weiAmount,
        uint256 tokenAmount,
        string crowdsalePhase,
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

    function() payable onlyWhenCrowdsaleIsOpen stopInEmergency external {
        assert(msg.data.length <= 68); // 64 bytes data limit plus 4 for the prefix
        assert(msg.value >= MIN_INVEST);

        uint256 tokens = msg.value.mul(currentRate);
        currentSupply = currentSupply.sub(tokens);
        evc.mint(msg.sender, tokens);
        totalRaised = totalRaised.add(msg.value);

        InvestmentMade(
            msg.sender,
            msg.value,
            tokens,
            currentStateToString(),
            msg.data
        );
    }

    function startPhase1() onlyOwner inState(State.Ready) stopInEmergency external {
        currentTotalSupply = evc.mintableSupply().sub(PHASE2_SUPPLY).sub(PHASE3_SUPPLY);
        currentSupply = currentTotalSupply;
        currentRate = PHASE1_RATE;
        currentState = State.Phase1;

        StateChanged(State.Ready, currentState);
    }

    function startPhase2() onlyOwner inState(State.Phase1) stopInEmergency external {
        phaseClaim();

        currentTotalSupply = currentSupply.add(PHASE2_SUPPLY);
        currentSupply = currentTotalSupply;
        currentRate = PHASE2_RATE;
        currentState = State.Phase2;

        StateChanged(State.Phase1, currentState);
    }

    function startPhase3() onlyOwner inState(State.Phase2) stopInEmergency external {
        phaseClaim();

        currentTotalSupply = currentSupply.add(PHASE3_SUPPLY);
        currentSupply = currentTotalSupply;
        currentRate = PHASE3_RATE;
        currentState = State.Phase3;

        StateChanged(State.Phase2, currentState);
    }

    function endCrowdsale() onlyOwner inState(State.Phase3) stopInEmergency external {
        phaseClaim();

        currentTotalSupply = 0;
        currentSupply = 0;
        currentRate = 0;
        currentState = State.CrowdsaleEnded;

        StateChanged(State.Phase3, currentState);
    }

    function currentStateToString() constant returns (string) {
        if (currentState == State.Ready) {
            return "Ready";
        } else if (currentState == State.Phase1) {
            return "Phase 1";
        } else if (currentState == State.Phase2) {
            return "Phase 2";
        } else if (currentState == State.Phase3) {
            return "Phase 3";
        } else {
            return "Crowdsale ended";
        }
    }

    function phaseClaim() internal {
        uint256 beneficiaryTwoClaim = this.balance.div(100).mul(BTWO_CLAIM_PERCENT);
        beneficiaryTwo.transfer(beneficiaryTwoClaim);
        FundsClaimed(beneficiaryTwo, beneficiaryTwoClaim, currentStateToString());

        uint256 beneficiaryClaim = this.balance;
        beneficiary.transfer(this.balance);
        FundsClaimed(beneficiary, beneficiaryClaim, currentStateToString());
    }

    modifier inState(State _state) {
        assert(currentState == _state);
        _;
    }

    modifier onlyWhenCrowdsaleIsOpen() {
        assert(currentState == State.Phase1 || currentState == State.Phase2 || currentState == State.Phase3);
        _;
    }
}
