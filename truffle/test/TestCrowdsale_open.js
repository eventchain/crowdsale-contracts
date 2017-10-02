/* eslint-env node, mocha */

import expectThrow from "./helpers/expectThrow";
import { EXCHANGE_RATE, EASTER_EGG_BONUS, STATES } from "./helpers/constants";

const Crowdsale = artifacts.require("./ico/EventChainCrowdsale.sol");
const EventChain = artifacts.require("./ico/EventChain.sol");

contract("Crowdsale{CrowdsaleOpen}", accounts => {
    const beneficiaryAccount = accounts[2],
        investorAccount = accounts[1],
        beneficiaryTwoAccount = accounts[3];
    let crowdsale, evc;

    before(async() => {
        evc = await EventChain.new();
        crowdsale = await Crowdsale.new(evc.address, beneficiaryAccount, beneficiaryTwoAccount);
        await evc.setMintAgent(crowdsale.address, true);
    });

    describe("openCrowdsale()", () => {
        let mintableSupply, txResult;

        before(async() => {
            mintableSupply = await evc.mintableSupply.call();
            txResult = await crowdsale.openCrowdsale();
        });

        it("should set the currentRate to 800 EVC/ETH", async() => {
            const currentRate = await crowdsale.currentRate.call();

            assert.equal(currentRate.toNumber(), EXCHANGE_RATE);
        });

        it("should set the currentTotalSupply to the mintableSupply", async() => {
            const currentTotalSupply = await crowdsale.currentTotalSupply.call();

            assert.equal(currentTotalSupply.toNumber(), mintableSupply);
        });

        it("should set the currentSupply to the same value as the  currentTotalSupply", async() => {
            const currentSupply = await crowdsale.currentSupply.call();
            const currentTotalSupply = await crowdsale.currentTotalSupply.call();

            assert.equal(currentSupply.toNumber(), currentTotalSupply);
        });

        it("should set the currentState to 'CrowdsaleOpen'", async() => {
            const currentState = await crowdsale.currentState.call();

            assert.equal(currentState, STATES.CROWDSALE_OPEN);
        });

        it("should raise an StateChanged event from 'Ready' to 'CrowdsaleOpen'", async() => {
            const { event, args } = txResult.logs[0],
                { from, to } = args;

            assert.equal(event, "StateChanged");
            assert.equal(from, STATES.READY);
            assert.equal(to, STATES.CROWDSALE_OPEN);
        });
    });

    describe("State.CrowdsaleOpen", () => {
        it("should throw an error when openCrowdsale is called again", async() => {
            await expectThrow(crowdsale.openCrowdsale());
        });

        it("should raise an error when endCrowdsale is called by someone other than the owner", async() => {
            await expectThrow(crowdsale.endCrowdsale({ from: investorAccount }));
        });
    });

    describe("send(2 ether)", () => {
        const WEI_SENT = web3.toWei(2, "ether");
        const TOKENS_BOUGHT = web3.toBigNumber(EXCHANGE_RATE).mul(WEI_SENT);
        let balanceBefore, supplyBefore, mintableSupplyBefore, currentTotalSupplyBefore, fundsBefore, totalRaisedBefore, txResult;

        before(async() => {
            balanceBefore = await evc.balanceOf.call(investorAccount);
            supplyBefore = await crowdsale.currentSupply.call();
            currentTotalSupplyBefore = await crowdsale.currentTotalSupply.call();
            totalRaisedBefore = await crowdsale.totalRaised.call();
            mintableSupplyBefore = await evc.mintableSupply.call();
            fundsBefore = web3.eth.getBalance(crowdsale.address);
            txResult = await crowdsale.sendTransaction({ from: investorAccount, value: WEI_SENT });
        });

        it("should add 2 ether to the crowdsale's funds", async() => {
            assert.equal(
                web3.eth.getBalance(crowdsale.address).toNumber(),
                fundsBefore.add(WEI_SENT).toNumber()
            );
        });

        it("should add 2 ether to the crowdsale's totalRaised member", async() => {
            const totalRaised = await crowdsale.totalRaised.call();

            assert.equal(totalRaised, totalRaisedBefore.add(WEI_SENT).toNumber());
        });

        it("should transfer 1600 tokens to the investor's address", async() => {
            const balance = await evc.balanceOf.call(investorAccount);

            assert.equal(web3.toBigNumber(balance).minus(balanceBefore).toNumber(), TOKENS_BOUGHT);
        });

        it("should reduce the currentSupply by 1600 tokens", async() => {
            const currentSupply = await crowdsale.currentSupply.call();

            assert.equal(currentSupply.toNumber(), supplyBefore.minus(TOKENS_BOUGHT));
        });

        it("should NOT change the currentTotalSupply", async() => {
            const currentTotalSupply = await crowdsale.currentTotalSupply.call();

            assert.equal(currentTotalSupply.toNumber(), currentTotalSupplyBefore);
        });

        it("should reduce the token's mintableSupply by 1800", async() => {
            const mintableSupply = await evc.mintableSupply.call();

            assert.equal(mintableSupply.toNumber(), mintableSupplyBefore.minus(TOKENS_BOUGHT));
        });

        it("should raise an InvestmentMade event", async() => {
            const { event, args } = txResult.logs[0],
                { investor, weiAmount, tokenAmount, calldata } = args;

            assert.equal(event, "InvestmentMade");
            assert.equal(investor, investorAccount);
            assert.equal(weiAmount, WEI_SENT);
            assert.equal(tokenAmount.toNumber(), TOKENS_BOUGHT);
            assert.equal(calldata, "0x");
        });
    });

    describe("send(3 ether) with data", () => {
        const WEI_SENT = web3.toWei(3, "ether");
        const TOKENS_BOUGHT = web3.toBigNumber(EXCHANGE_RATE + EASTER_EGG_BONUS).mul(WEI_SENT);
        const DATA = "0x68656c6c6f20776f726c6421"; // hex-encoded: hello world!
        const LARGE_DATA = "0x736F206261736963616C6C7920626974636F696E206973206265636F6D696E67206C696B652063727970746F20676F6C64DA6574686572756D206973206C696B65206F696CDA726970706C65206973206C696B652063617368206D61796265DA616E64206D6F6E65726F2069732074686520756E64657267726F756E64206B696E67DA74686174201973206D7920636F6E636C7573696F6E";
        let balanceBefore, supplyBefore, mintableSupplyBefore, currentTotalSupplyBefore, fundsBefore, totalRaisedBefore, txResult;

        before(async() => {
            balanceBefore = await evc.balanceOf.call(investorAccount);
            supplyBefore = await crowdsale.currentSupply.call();
            currentTotalSupplyBefore = await crowdsale.currentTotalSupply.call();
            totalRaisedBefore = await crowdsale.totalRaised.call();
            mintableSupplyBefore = await evc.mintableSupply.call();
            fundsBefore = web3.eth.getBalance(crowdsale.address);
            txResult = await crowdsale.sendTransaction({ from: investorAccount, value: WEI_SENT, data: DATA });
        });

        it("should add 3 ether to the crowdsale's funds", async() => {
            assert.equal(
                web3.eth.getBalance(crowdsale.address).toNumber(),
                fundsBefore.add(WEI_SENT).toNumber()
            );
        });

        it("should add 3 ether to the crowdsale's totalRaised member", async() => {
            const totalRaised = await crowdsale.totalRaised.call();

            assert.equal(totalRaised, totalRaisedBefore.add(WEI_SENT).toNumber());
        });

        it("should transfer 3408 tokens to the investor's address", async() => {
            const balance = await evc.balanceOf.call(investorAccount);

            assert.equal(web3.toBigNumber(balance).minus(balanceBefore).toNumber(), TOKENS_BOUGHT);
        });

        it("should reduce the currentSupply by 3408 tokens", async() => {
            const currentSupply = await crowdsale.currentSupply.call();

            assert.equal(currentSupply.toNumber(), supplyBefore.minus(TOKENS_BOUGHT));
        });

        it("should NOT change the currentTotalSupply", async() => {
            const currentTotalSupply = await crowdsale.currentTotalSupply.call();

            assert.equal(currentTotalSupply.toNumber(), currentTotalSupplyBefore);
        });

        it("should reduce the token's mintableSupply by 3408", async() => {
            const mintableSupply = await evc.mintableSupply.call();

            assert.equal(mintableSupply.toNumber(), mintableSupplyBefore.minus(TOKENS_BOUGHT));
        });

        it("should raise an InvestmentMade event", async() => {
            const { event, args } = txResult.logs[0],
                { investor, weiAmount, tokenAmount, calldata } = args;

            assert.equal(event, "InvestmentMade");
            assert.equal(investor, investorAccount);
            assert.equal(weiAmount, WEI_SENT);
            assert.equal(tokenAmount.toNumber(), TOKENS_BOUGHT);
            assert.equal(calldata, DATA);
        });

        it("should throw an error if the sent data is too large", async() => {
            await expectThrow(crowdsale.sendTransaction({ from: investorAccount, value: WEI_SENT, data: LARGE_DATA }));
        });
    });
});
