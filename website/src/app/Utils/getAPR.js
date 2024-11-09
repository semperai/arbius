export const getAPR = (rate, supply) => {
  const AIUS_wei = 1000000000000000000;
  //console.log(rate, supply, "RATE supply")
  rate = Number(rate) / AIUS_wei;
  supply = Number(supply) / AIUS_wei;
  //console.log(rate, supply, "RATE supply 2")
  const rewardPerveAiusPerSecond = rate / supply;
  let apr = rewardPerveAiusPerSecond * 31536000; // reward per second multiplied by seconds in an year
  apr = apr * 100; // APR percentage
  console.log(apr);
  if (apr) {
    return apr;
  }
  return 0;
};
