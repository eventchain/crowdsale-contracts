/* eslint-env node, mocha */

import expectThrow from "./helpers/expectThrow";
import { STATES } from "./helpers/constants";

const Crowdsale = artifacts.require("./ico/EventChainCrowdsale.sol");
const EventChain = artifacts.require("./ico/EventChain.sol");

contract("Crowdsale{Setup}", accounts => {
    const beneficiaryAccount = accounts[2],
        investorAccount = accounts[1],
        beneficiaryTwoAccount = accounts[3];
    let crowdsale, evc;

    before(async() => {
        evc = await EventChain.new();
        crowdsale = await Crowdsale.new(evc.address, beneficiaryAccount, beneficiaryTwoAccount);
        await evc.setMintAgent(crowdsale.address, true);
    });

    describe("construct()", () => {
        it("should store the EventChain address", async() => {
            const evcAddress = await crowdsale.evc.call();

            assert.equal(evcAddress, evc.address);
        });

        it("should store the beneficiary address", async() => {
            const beneficiary = await crowdsale.beneficiary.call();

            assert.equal(beneficiary, beneficiaryAccount);
        });

        it("should store the beneficiaryTwo address", async() => {
            const beneficiaryTwo = await crowdsale.beneficiaryTwo.call();

            assert.equal(beneficiaryTwo, beneficiaryTwoAccount);
        });

        it("should set owner to msg.sender", async() => {
            const owner = await crowdsale.owner.call();

            assert.equal(owner, accounts[0]);
        });

        it("should set currentState set to 'READY'", async() => {
            const currentState = await crowdsale.currentState.call();

            assert.equal(currentState, STATES.READY);
        });

        it("should fail if the EventChain address is missing", async() => {
            await expectThrow(Crowdsale.new());
        });

        it("should fail if the beneficiary address is missing", async() => {
            await expectThrow(Crowdsale.new(evc.address));
        });

        it("should fail if the beneficiaryTwo address is missing", async() => {
            await expectThrow(Crowdsale.new(evc.address, beneficiaryAccount));
        });
    });

    describe("State.READY", () => {
        it("should raise an error when the fallback payable is called", async() => {
            await expectThrow(crowdsale.sendTransaction({ from: investorAccount, value: web3.toWei(5, "ether") }));
        });

        it("should raise an error when startPhase2 is called", async() => {
            await expectThrow(crowdsale.startPhase2());
        });

        it("should raise an error when startPhase3 is called", async() => {
            await expectThrow(crowdsale.startPhase3());
        });

        it("should raise an error when endCrowdsale is called", async() => {
            await expectThrow(crowdsale.endCrowdsale());
        });

        it("should raise an error when startPhase1 is called by someone other than the owner", async() => {
            await expectThrow(crowdsale.startPhase1({ from: investorAccount }));
        });
    });
});
