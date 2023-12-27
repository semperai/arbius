#!/bin/bash

# script to initialize local blockchain for testing
# have `npx hardhat node` running


set -e

source ~/.nvm/nvm.sh

cd contract
nvm use

# do this after nvm setup to skip printing all of that
set -x

npx hardhat --network localhost run scripts/001-deploy.ts

# delegate voting to self
npx hardhat --network localhost governance:delegate --address 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# deploy a delegated validator
npx hardhat --network localhost validator:deploy-delegation 0x7d0e9c2d39fba3c92e7473b203c02414a2d38f565873e7aa5715d5262918f518
