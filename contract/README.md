# Arbius Contracts

## Install

Install Foundry: https://getfoundry.sh/

To install dependencies and compile contracts:

```bash
git clone https://github.com/semperai/arbius
cd arbius/contract/
yarn
```

Create a skeleton `config.local.json` file:

```bash
echo "{}" > scripts/config.local.json
```

Then, run `yarn compile`. 

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
yarn forge-test
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
npx hardhat run scripts/deploy-sepolia-v4.ts --network arbsepolia
```

To verify contracts `ETHERSCAN_API_KEY` must be set in .env

```
npx hardhat verify <contract-address> --network arbsepolia
```

## Other

Show contract sizes

```
forge build --sizes
```
