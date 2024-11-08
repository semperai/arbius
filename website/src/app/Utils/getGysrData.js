// graphqlApi.js
import axios from 'axios';

export const fetchData = async (apiKey, query) => {
  const url = `https://gateway-arbitrum.network.thegraph.com/api/3cf022c3bc3bb0a1c88c5439792c82c4/subgraphs/id/Bmkv8LV6Jxau2sdpDWPQAQ87QgNMgAW6wYhDeq1kDP8y`;

  try {
    const response = await axios.post(url, {
    "operationName": "POOL",
    "variables": {
        "poolId": "0xf0148b59d7f31084fb22ff969321fdfafa600c02",
        "positionId": "0xf0148b59d7f31084fb22ff969321fdfafa600c02_0x000000000000000000000000870b345d6baa01e145c8b74b10e6eada5bfedf51"
    },
    "query": "query POOL($poolId: String!, $positionId: String!) {\n  pool(id: $poolId) {\n    id\n    name\n    description\n    website\n    staked\n    funded\n    rewards\n    distributed\n    apr\n    tvl\n    stakingSharesPerToken\n    rewardSharesPerToken\n    start\n    end\n    operations\n    createdTimestamp\n    state\n    volume\n    poolType\n    sharesPerSecond\n    fundings(orderBy: start, orderDirection: asc) {\n      id\n      start\n      end\n      sharesPerSecond\n      token {\n        id\n        symbol\n        __typename\n      }\n      __typename\n    }\n    stakingToken {\n      id\n      symbol\n      alias\n      decimals\n      type\n      underlying {\n        id\n        __typename\n      }\n      __typename\n    }\n    rewardToken {\n      id\n      symbol\n      alias\n      decimals\n      type\n      __typename\n    }\n    stakingTokens {\n      id\n      token {\n        id\n        symbol\n        alias\n        decimals\n        type\n        underlying {\n          id\n          __typename\n        }\n        __typename\n      }\n      amount\n      sharesPerToken\n      __typename\n    }\n    rewardTokens {\n      id\n      token {\n        id\n        symbol\n        alias\n        decimals\n        type\n        __typename\n      }\n      amount\n      apr\n      sharesPerSecond\n      sharesPerToken\n      __typename\n    }\n    __typename\n  }\n  position(id: $positionId) {\n    id\n    stakes(first: 1, orderBy: timestamp, orderDirection: asc) {\n      id\n      timestamp\n      __typename\n    }\n    __typename\n  }\n}\n",
    });
    return response.data;
  } catch (error) {
    console.error('There was a problem with the axios operation:', error);
    throw error;
  }
};

export default fetchData;
