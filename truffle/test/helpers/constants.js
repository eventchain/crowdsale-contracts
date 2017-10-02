
const DECIMALS = 18;

function withDecimals(tokens) {
    return tokens * Math.pow(10, DECIMALS);
}

module.exports = {
    DECIMALS,
    withDecimals,
    SYMBOL: "EVC",
    NAME: "EventChain",
    TOTAL_SUPPLY: withDecimals(84000000),
    BTWO_CLAIM_PERCENT: 3,
    EXCHANGE_RATE: 800,
    EASTER_EGG_BONUS: 336,
    STATES: {
        READY: 0,
        CROWDSALE_OPEN: 1,
        CROWDSALE_ENDED: 2
    }
};
