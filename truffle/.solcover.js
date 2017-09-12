module.exports = {
    norpc: true,
    copyNodeModules: false,
    testCommand: 'node --max-old-space-size=4096 ../node_modules/.bin/truffle test --network coverage',
    skipFiles: ['Migrations.sol']
}