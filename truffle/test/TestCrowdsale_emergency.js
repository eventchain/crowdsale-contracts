/* eslint-env node, mocha */

import expectThrow from "./helpers/expectThrow";

const Crowdsale = artifacts.require("./ico/EventChainCrowdsale.sol");
const EventChain = artifacts.require("./ico/EventChain.sol");

contract("Crowdsale{Emergency}", accounts => {
    const beneficiaryAccount = accounts[2],
        investorAccount = accounts[1],
        beneficiaryTwoAccount = accounts[3];
    let crowdsale, evc;

    before(async() => {
        evc = await EventChain.new();
        crowdsale = await Crowdsale.new(evc.address, beneficiaryAccount, beneficiaryTwoAccount);
        await evc.setMintAgent(crowdsale.address, true);
        await crowdsale.openCrowdsale();
    });

    describe("halt()", () => {
        before(async() => {
            await crowdsale.halt();
        });

        it("should set the halted member to true", async() => {
            const halted = await crowdsale.halted.call();

            assert.equal(halted, true);
        });

        it("should raise an error when halted and the default payable is called", async() => {
            await expectThrow(crowdsale.sendTransaction({ from: investorAccount, value: web3.toWei(13, "ether") }));
        });
    });

    describe("unhalt()", () => {
        before(async() => {
            await crowdsale.unhalt();
        });

        it("should set the halted member back to false", async() => {
            const halted = await crowdsale.halted.call();

            assert.equal(halted, false);
        });

        it("should be ok again when the default payable is called", async() => {
            const txResult = await crowdsale.sendTransaction({ from: investorAccount, value: web3.toWei(13, "ether") });

            assert.isOk(txResult);
        });
    });
});
