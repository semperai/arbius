// TODO this

// users should trade baseModelToken
// arbius fees should be sent to ArbiusReceiverConverter
// ArbiusReceiverConverter will convert the Arbius to BasicModelToken and send to xBasicModel
async function deployModel(
  baseToken,
  name: string,
  symbol: string,
  initialSupply: ethers.BigNumber,
  fee: ethers.BigNumber,
  cid: string,
  lpStakingMintPerSecond: ethers.BigNumber,
) {
  const BasicModelToken = await ethers.getContractFactory("BasicModelToken");
  const basicModelToken = await BasicModelToken.deploy(
    name,
    symbol,
    initialSupply,
  );
  console.log(`BasicModelToken (${name}) deployed to: ${basicModelToken.address}`);

  const XBasicModelToken = await ethers.getContractFactory("XBasicModelToken");
  const xBasicModelToken = await XBasicModelToken.deploy(
    basicModelToken.address,
    `${name}.x`,
    `${symbol}.x`,
  );
  console.log(`XBasicModelToken (${name}) deployed to: ${xBasicModelToken.address}`);

  const ArbiusReceiverConverter = await ethers.getContractFactory("ArbiusReceiverConverter");
  const arbiusReceiverConverter = await ArbiusReceiverConverter.deploy(
    baseToken.address,
    basicModelToken.address,
    xBasicModelToken.address,
    SushiSwapRouterAddress,
  );
  console.log(`ArbiusReceiverConverter deployed to: ${ArbiusReceiverConverter.address}`);

  // TODO delete this
  // (await basicModelToken.mint('0x949e9Cc4e04972a32842Cd9d361298E57859c73e', ethers.utils.parseEther('50'))).wait();

  const factory = await ethers.getContractAt("IUniswapV2Factory", SushiSwapFactoryAddress); 

  let calculatedLpAddress = await factory.getPair(baseToken.address, basicModelToken.address);
  /*
  { // TODO delete this section when we can deploy using calculated address
    const fakeLPToken = await BasicModelToken.deploy(
      'fake lp',
      'flp',
      ethers.utils.parseEther('10'),
    );
    calculatedLpAddress = fakeLPToken.address;
    console.log(`Fake LP deployed to: ${fakeLPToken.address}`);

    // TODO delete this
    (await fakeLPToken.mint('0x949e9Cc4e04972a32842Cd9d361298E57859c73e', ethers.utils.parseEther('5'))).wait();
    console.log(`Fake LP minted for testing`);
  }
  */


  const BasicModelLPStaking = await ethers.getContractFactory("BasicModelLPStaking");
  const basicModelLPStaking = await BasicModelLPStaking.deploy(
    calculatedLpAddress,
    basicModelToken.address,
    lpStakingMintPerSecond,
  );
  console.log(`BasicModelLPStaking (${name}) deployed to: ${basicModelLPStaking.address}`);


  await (await basicModelToken.transferOwnership(basicModelLPStaking.address)).wait();
  console.log(`Transferred BasicModelToken to BasicModelLPStaking ${basicModelLPStaking.address}`);


  const modelParams = {
    addr: arbiusReceiverConverter.address,
    fee,
    cid,
  };
  const modelId = await engine.hashModel(modelParams, await deployer.getAddress());
  await (await engine
    .connect(deployer)
    .registerModel(modelParams.addr, modelParams.fee, modelParams.cid)
  ).wait();
  console.log('model added with id', modelId);

  await (await engine
    .connect(deployer)
    .setSolutionMineableStatus(modelId, true)
  ).wait();
  console.log('model is now mineable');

  return {
    modelId,
    params: modelParams,
    basicModelTokenAddress: basicModelToken.address,
    xBasicModelTokenAddress: xBasicModelToken.address,
    basicModelLPStakingAddress: basicModelLPStaking.address,
    lpAddress: calculatedLpAddress,
    arbiusReceiverConverterAddress: arbiusReceiverConverter.address,
  }
}
