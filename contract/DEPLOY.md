edit .env L1 and L2 data (private key and rpc url)
ensure you have enough eth in your wallet both on l1 and l2
(you can bridge from l1 -> l2, l2 needs very little)


```
npx hardhat run scripts/000-deployl1.ts

# this requires network to be set because upgrades plugin broken
npx hardhat run --network arbgoerli scripts/001-deployl2.ts

# this may take quite a while...
npx hardhat run scripts/002-register-gateway.ts


# set up streams

# navigate to https://app.sablier.com/create/single/?shape=linear
# connect wallet / ensure correct address
# create proxy at the bottom
# ensure your allowance is big enough (200_000)

# for private sale, you will have to do this 6 times:
# TODO update this with correct numbers/addresses

# in `scripts/config.json` copy the `l1TokenAddress`
# ensure you are on the correct network
# set cancellability to Off
# select token by pasting in the `l1TokenAddress`
# set amount to 16666.666666666666666666
# set start date to today, 12:00 am
# set end date to 2 years from now, 12:00 am
# set recipient to:
# * 0x8Bf544e4A5d10D7549ed033b325b54Eb04f225bf
# * 0x8Bf544e4A5d10D7549ed033b325b54Eb04f225bf
# * 0x8Bf544e4A5d10D7549ed033b325b54Eb04f225bf
# * 0x8Bf544e4A5d10D7549ed033b325b54Eb04f225bf
# * 0x8Bf544e4A5d10D7549ed033b325b54Eb04f225bf
# * 0x8Bf544e4A5d10D7549ed033b325b54Eb04f225bf


# for team, you will have to do this few times:
# TODO update this with correct numbers/addresses

# in `scripts/config.json` copy the `l1TokenAddress`
# set cancellability to Off
# select token by pasting in the `l1TokenAddress`
# set start date to today, 12:00 am
# set end date to 4 years from now, 12:00 am
# set recipient / amount to:
# * 0x8Bf544e4A5d10D7549ed033b325b54Eb04f225bf 84000 # ME
# * 0x8Bf544e4A5d10D7549ed033b325b54Eb04f225bf 16000 # Joey




# Bridge tokens to L2

# navigate to https://bridge.arbitrum.io/
# From: mainnet -> l2
# click "ETH" dropdown and input l1TokenAddress
# Set amount to 700_000
# Click on button to bridge

# this will take about 10 minutes



# continue deploying core contracts

npx hardhat run --network arbgoerli scripts/003-deploy-core.ts


```
