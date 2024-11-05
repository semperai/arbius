#!/bin/bash

# you can use this as a base to easily test a model locally

npx hardhat --network localhost run scripts/deploy-local-net.ts
npx hardhat --network localhost mining:allowance
npx hardhat --network localhost validator:stake

MODEL=0x002a11afdb4f9e0ae985136622cbea64dd5d90d3d751ce1ad2391264e886aad1

# for local testing can use whatever input and default cid
TASK=$(npx hardhat --network localhost mining:submitTask --model $MODEL --fee 0.001 --input "test")
echo $TASK

# you can use this alternatively to test multiple signals
# npx hardhat --network localhost mining:signalCommitment --task $TASK
npx hardhat --network localhost mining:submitSolution --task $TASK # --commit false


# after some time, claim
# npx hardhat --network localhost mining:claimSolution --task $TASK
