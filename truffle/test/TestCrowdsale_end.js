/* eslint-env node, mocha */

import expectThrow from "./helpers/expectThrow";
import { STATES } from "./helpers/constants";

const Crowdsale = artifacts.require("./ico/EventChainCrowdsale.sol");
const EventChain = artifacts.require("./ico/EventChain.sol");

contract("Crowdsale{End}", accounts => {
    const beneficiaryAccount = accounts[2],
        investorAccount = accounts[1],
        beneficiaryTwoAccount = accounts[3];
    const PHASE3_RAISED = web3.toWei(23, "ether"),
        BENEFICIARY_TWO_CLAIM = PHASE3_RAISED * 0.03,
        BENEFICIARY_CLAIM = PHASE3_RAISED - BENEFICIARY_TWO_CLAIM;
    let crowdsale, evc;

    before(async() => {
        evc = await EventChain.new();
        crowdsale = await Crowdsale.new(evc.address, beneficiaryAccount, beneficiaryTwoAccount);
        await evc.setMintAgent(crowdsale.address, true);
        await crowdsale.startPhase1();
        await crowdsale.startPhase2();
        await crowdsale.startPhase3();
        await crowdsale.sendTransaction({ from: investorAccount, value: PHASE3_RAISED });
    });

    describe("endCrowdsale()", () => {
        let txResult, beneficiaryBalanceBefore, beneficiaryTwoBalanceBefore;

        before(async() => {
            beneficiaryBalanceBefore = await web3.eth.getBalance(beneficiaryAccount);
            beneficiaryTwoBalanceBefore = await web3.eth.getBalance(beneficiaryTwoAccount);
            txResult = await crowdsale.endCrowdsale();
        });

        it("should set the currentRate to 0", async() => {
            const currentRate = await crowdsale.currentRate.call();

            assert.equal(currentRate.toNumber(), 0);
        });

        it("should set the currentTotalSupply to 0", async() => {
            const currentTotalSupply = await crowdsale.currentTotalSupply.call();

            assert.equal(currentTotalSupply.toNumber(), 0);
        });

        it("should set the currentSupply to 0", async() => {
            const currentSupply = await crowdsale.currentSupply.call();

            assert.equal(currentSupply.toNumber(), 0);
        });

        it("should set the currentState to 'CrowdsaleEnded'", async() => {
            const currentState = await crowdsale.currentState.call();

            assert.equal(currentState, STATES.CROWDSALE_ENDED);
        });

        it("should claim the phase3 funds for the beneficiaries", async() => {
            const fundsAfterClosed = await web3.eth.getBalance(crowdsale.address);

            assert.equal(fundsAfterClosed.toNumber(), 0);
        });

        it("should claim 3% of the phase3 funds for the beneficiary two", async() => {
            const beneficiaryTwoBalance = await web3.eth.getBalance(beneficiaryTwoAccount);

            assert.equal(beneficiaryTwoBalance.toNumber(), beneficiaryTwoBalanceBefore.add(BENEFICIARY_TWO_CLAIM));
        });

        it("should claim 97% of the phase3 funds for the beneficiary", async() => {
            const beneficiaryBalance = await web3.eth.getBalance(beneficiaryAccount);

            assert.equal(beneficiaryBalance.toNumber(), beneficiaryBalanceBefore.add(BENEFICIARY_CLAIM));
        });

        it("should raise an FundsClaimed event for the beneficiaryTwo", async() => {
            const { event, args } = txResult.logs[0],
                { receiver, claim, crowdsalePhase } = args;

            assert.equal(event, "FundsClaimed");
            assert.equal(receiver, beneficiaryTwoAccount);
            assert.equal(claim.toNumber(), BENEFICIARY_TWO_CLAIM);
            assert.equal(crowdsalePhase, "Phase 3");
        });

        it("should raise an FundsClaimed event for the beneficiary", async() => {
            const { event, args } = txResult.logs[1],
                { receiver, claim, crowdsalePhase } = args;

            assert.equal(event, "FundsClaimed");
            assert.equal(receiver, beneficiaryAccount);
            assert.equal(claim.toNumber(), BENEFICIARY_CLAIM);
            assert.equal(crowdsalePhase, "Phase 3");
        });

        it("should raise an StateChanged event from 'Phase3' to 'CrowsaleEnded'", async() => {
            const { event, args } = txResult.logs[2],
                { from, to } = args;

            assert.equal(event, "StateChanged");
            assert.equal(from, STATES.PHASE3);
            assert.equal(to, STATES.CROWDSALE_ENDED);
        });
    });

    describe("State.Phase3", () => {
        it("should throw an error when startPhase1 is called", async() => {
            await expectThrow(crowdsale.startPhase1());
        });

        it("should throw an error when startPhase2 is called", async() => {
            await expectThrow(crowdsale.startPhase2());
        });

        it("should throw an error when startPhase3 is called", async() => {
            await expectThrow(crowdsale.startPhase3());
        });

        it("should throw an error when endCrowdsale is called more then once", async() => {
            await expectThrow(crowdsale.endCrowdsale());
        });

        it("should raise an error when the fallback payable is called", async() => {
            await expectThrow(crowdsale.sendTransaction({ from: investorAccount, value: web3.toWei(5, "ether") }));
        });
    });
});
