# Arbius Reference Miner

Read https://docs.arbius.ai/mining for a detailed setup guide of the Arbius Reference Miner.

## Setup

```bash
nvm use
yarn
yarn start:dev CONFIG.json
```

### Local Development

Navigate to the `./contract` directory and run the following commands to deploy the contracts to your local hardhat network.

```bash
# start local network
npx hardhat node
# copy over the private keys to a few new miner configs
# MiningConfig.local.1.json and so on

npx hardhat --network localhost run scripts/deploy-local-net.ts
cp scripts/config.local.json ../miner/config.json
# start your local miners with the new config

yarn start:dev MiningConfig.local.1.json
```
