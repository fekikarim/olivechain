module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "5777",
    },
  },
  compilers: {
    solc: {
      version: "0.8.24",
      settings: {
        optimizer: { enabled: true, runs: 200 },
        evmVersion: "paris", // Ganache 7 has no push0/mcopy
      },
    },
  },
  mocha: { timeout: 120000 },
};
