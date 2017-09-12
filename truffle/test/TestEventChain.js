/* eslint-env node, mocha */

import expectThrow from "./helpers/expectThrow";
import { SYMBOL, NAME, DECIMALS, TOTAL_SUPPLY, withDecimals } from "./helpers/constants";

const EventChain = artifacts.require("./ico/EventChain.sol");

contract("EventChain", accounts => {
    const deployer = accounts[0],
        user1 = accounts[1],
        user2 = accounts[2];
    let evc;

    before(async() => {
        evc = await EventChain.new();
        await evc.setMintAgent(deployer, true);
    });

    describe("construct()", () => {
        it("should have a 18 decimals", async() => {
            const decimals = await evc.decimals.call();

            assert.equal(decimals, DECIMALS);
        });

        it("should have it's 'symbol' member set to EVC", async() => {
            const symbol = await evc.symbol.call();

            assert.equal(symbol, SYMBOL);
        });

        it("should have it's 'name' member set to EVC", async() => {
            const name = await evc.name.call();

            assert.equal(name, NAME);
        });

        it("should have a 'totalSupply' of 84 million", async() => {
            const totalSupply = await evc.totalSupply.call();

            assert.equal(totalSupply, TOTAL_SUPPLY);
        });

        it("should have an initial 'mintableSupply' of 84 million", async() => {
            const mintableSupply = await evc.mintableSupply.call();

            assert.equal(mintableSupply, TOTAL_SUPPLY);
        });

        it("should have a it's 'released' property be set to false", async() => {
            const released = await evc.released.call();

            assert.equal(released, false);
        });

        it("should set the deployer (msg.sender) as the 'releaseAgent'", async() => {
            const releaseAgent = await evc.releaseAgent.call();

            assert.equal(releaseAgent, deployer);
        });

        it("should set the deployer (msg.sender) as a 'mintAgent'", async() => {
            const isMintAgent = await evc.mintAgents.call(deployer);

            assert.equal(isMintAgent, true);
        });

        it("should set the deployer (msg.sender) as the owner", async() => {
            const owner = await evc.owner.call();

            assert.equal(owner, deployer);
        });
    });

    describe("mint(user1, 100 EVC)", () => {
        const MINTED_TOKENS = withDecimals(100);

        before(async() => {
            await evc.mint(user1, MINTED_TOKENS);
        });

        it("should mint 100 tokens to the user1", async() => {
            const balance = await evc.balanceOf(user1);

            assert.equal(balance, MINTED_TOKENS);
        });
    });

    describe("setMintAgent(deployer, false)", () => {

        before(async() => {
            await evc.setMintAgent(deployer, false);
        });

        it("should set the deployer mintAgent to false", async() => {
            const isMintAgent = await evc.mintAgents.call(deployer);

            assert.equal(false, isMintAgent);
        });
    });

    describe("approve(user2, 50 EVC)", () => {
        const APPROVED_TOKENS = withDecimals(50);

        before(async() => {
            await evc.approve(user2, APPROVED_TOKENS, { from: user1 });
        });

        it("should set an allowance for user2 to spend 50 EVC on user1's behalf", async() => {
            const allowance = await evc.allowance(user1, user2);

            assert.equal(allowance, APPROVED_TOKENS);
        });
    });

    describe("Unreleased: user1.transfer(user2, 50 EVC)", () => {
        it("should throw an error, since the token has not been released", async() => {
            await expectThrow(evc.transfer(user2, withDecimals(50), { from: user1 }));
        });
    });

    describe("Unreleased: user2.transferFrom(user1, 50 EVC)", () => {
        it("should throw an error, since the token has not been released", async() => {
            await expectThrow(evc.transferFrom(user1, user2, withDecimals(50), { from: user2 }));
        });
    });

    describe("releaseToken()", () => {
        before(async() => {
            await evc.releaseToken();
        });

        it("should set the 'released' member to true", async() => {
            const released = await evc.released.call();

            assert.equal(released, true);
        });
    });

    describe("Released: user1.transfer(user2, 20 EVC)", () => {
        const TRANSFERED_TOKENS = withDecimals(20);
        let user1BalanceBefore, user2BalanceBefore;

        before(async() => {
            user1BalanceBefore = await evc.balanceOf(user1);
            user2BalanceBefore = await evc.balanceOf(user2);
            await evc.transfer(user2, TRANSFERED_TOKENS, { from: user1 });
        });

        it("should transfer 20 tokens from user1 to user2", async() => {
            const user1Balance = await evc.balanceOf(user1);
            const user2Balance = await evc.balanceOf(user2);

            assert.equal(user1Balance.toNumber(), user1BalanceBefore.sub(TRANSFERED_TOKENS));
            assert.equal(user2Balance.toNumber(), user2BalanceBefore.add(TRANSFERED_TOKENS));
        });
    });

    describe("Released: user2.transferFrom(user1, user2, 50 EVC)", () => {
        const TRANSFERED_TOKENS = withDecimals(50);
        let user1BalanceBefore, user2BalanceBefore, allowanceBefore;

        before(async() => {
            user1BalanceBefore = await evc.balanceOf(user1);
            user2BalanceBefore = await evc.balanceOf(user2);
            allowanceBefore = await evc.allowance(user1, user2);
            await evc.transferFrom(user1, user2, TRANSFERED_TOKENS, { from: user2 });
        });

        it("should transfer 50 tokens from user1 to user2", async() => {
            const user1Balance = await evc.balanceOf(user1);
            const user2Balance = await evc.balanceOf(user2);
            const allowance = await evc.allowance(user1, user2);

            assert.equal(user1Balance.toNumber(), user1BalanceBefore.sub(TRANSFERED_TOKENS));
            assert.equal(user2Balance.toNumber(), user2BalanceBefore.add(TRANSFERED_TOKENS));
            assert.equal(allowance.toNumber(), allowanceBefore.sub(TRANSFERED_TOKENS));
        });
    });
});
