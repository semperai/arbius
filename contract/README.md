# Arbius Contracts

## Install

To install dependencies and compile contracts:

```bash
git clone https://github.com/semperai/arbius
cd arbius/contract/
npm install
```

Create a skeleton `config.local.json` file:

```bash
nano scripts/config.local.json
```

Insert an empty json object:
```json
{}
```

Create a .env file according to the example file, then, run `npm run compile`. 

## Tests

To run Hardhat tests:

```bash
npx hardhat test
```

To run Foundry tests:

```bash
forge test
```

To run only specific tests or test files:

```bash
forge test --mt testToRun
forge test --mc testContractToRun
```

To test `Governance.t.sol` and `V2_EngineV4.sol` you need to deploy the contracts on your local hardhat network first:

```bash
npx hardhat node
npx hardhat test test/enginev4.test.ts --network localhost
npm run forge-test
```

## Local Development

Run the following commands to deploy the contracts to your local hardhat network.

```bash
npx hardhat node
npx hardhat --network localhost run scripts/deploy-local-net.ts
```

## Deploying

Set the required environment variables in the .env file, e.g. `ARBSEPOLIA_PRIVATE_KEY` and `ARBSEPOLIA_PROVIDER_URL`.

Example command to deploy on Arbitrum Sepolia:

```
npx hardhat run scripts/deploy-sepolia-v5.ts --network arbsepolia
```

To verify contracts `ETHERSCAN_API_KEY` must be set in .env

```
npx hardhat verify <contract-address> --network arbsepolia "constructor argument 1"
```

## Other

Show contract sizes

```
forge build --sizes
```
