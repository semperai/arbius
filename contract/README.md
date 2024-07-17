# Arbius Contracts

## Install

To install dependencies and compile contracts:

```bash
git clone https://github.com/semperai/arbius
cd arbius/contract/
npm i --legacy-peer-deps
```

Create a skeleton `config.local.json` file:

```bash
nano scripts/config.local.json
```

Insert an empty json object:
```json
{}
```

Then, run `npm run compile`. 

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
