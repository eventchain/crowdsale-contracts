
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
    EXCHANGE_RATES: {
        PHASE1: 1140,
        PHASE2: 920,
        PHASE3: 800
    },
    SUPPLIES: {
        PHASE2: withDecimals(21000000),
        PHASE3: withDecimals(22600000)
    },
    STATES: {
        READY: 0,
        PHASE1: 1,
        PHASE2: 2,
        PHASE3: 3,
        CROWDSALE_ENDED: 4
    }
};
