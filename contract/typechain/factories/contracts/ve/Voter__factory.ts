/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../common";
import type { Voter, VoterInterface } from "../../../contracts/ve/Voter";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_votingEscrow",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "weight",
        type: "uint256",
      },
    ],
    name: "Abstained",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "model",
        type: "bytes32",
      },
    ],
    name: "GaugeCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "model",
        type: "bytes32",
      },
    ],
    name: "GaugeKilled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "model",
        type: "bytes32",
      },
    ],
    name: "GaugeRevived",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "voter",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "model",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "weight",
        type: "uint256",
      },
    ],
    name: "Voted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "whitelister",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "model",
        type: "bytes32",
      },
    ],
    name: "Whitelisted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    name: "log",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "log_address",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256[]",
        name: "val",
        type: "uint256[]",
      },
    ],
    name: "log_array",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "int256[]",
        name: "val",
        type: "int256[]",
      },
    ],
    name: "log_array",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address[]",
        name: "val",
        type: "address[]",
      },
    ],
    name: "log_array",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    name: "log_bytes",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "log_bytes32",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "int256",
        name: "",
        type: "int256",
      },
    ],
    name: "log_int",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "key",
        type: "string",
      },
      {
        indexed: false,
        internalType: "address",
        name: "val",
        type: "address",
      },
    ],
    name: "log_named_address",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "key",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "val",
        type: "uint256[]",
      },
    ],
    name: "log_named_array",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "key",
        type: "string",
      },
      {
        indexed: false,
        internalType: "int256[]",
        name: "val",
        type: "int256[]",
      },
    ],
    name: "log_named_array",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "key",
        type: "string",
      },
      {
        indexed: false,
        internalType: "address[]",
        name: "val",
        type: "address[]",
      },
    ],
    name: "log_named_array",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "key",
        type: "string",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "val",
        type: "bytes",
      },
    ],
    name: "log_named_bytes",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "key",
        type: "string",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "val",
        type: "bytes32",
      },
    ],
    name: "log_named_bytes32",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "key",
        type: "string",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "val",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "decimals",
        type: "uint256",
      },
    ],
    name: "log_named_decimal_int",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "key",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "val",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "decimals",
        type: "uint256",
      },
    ],
    name: "log_named_decimal_uint",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "key",
        type: "string",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "val",
        type: "int256",
      },
    ],
    name: "log_named_int",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "key",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "val",
        type: "string",
      },
    ],
    name: "log_named_string",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "key",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "val",
        type: "uint256",
      },
    ],
    name: "log_named_uint",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    name: "log_string",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "log_uint",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    name: "logs",
    type: "event",
  },
  {
    inputs: [],
    name: "IS_TEST",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_model",
        type: "bytes32",
      },
    ],
    name: "createGauge",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "epochVoteEnd",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "excludeArtifacts",
    outputs: [
      {
        internalType: "string[]",
        name: "excludedArtifacts_",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "excludeContracts",
    outputs: [
      {
        internalType: "address[]",
        name: "excludedContracts_",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "excludeSenders",
    outputs: [
      {
        internalType: "address[]",
        name: "excludedSenders_",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "failed",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_model",
        type: "bytes32",
      },
    ],
    name: "getGaugeMultiplier",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "isAlive",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "isGauge",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "isWhitelisted",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_model",
        type: "bytes32",
      },
    ],
    name: "killGauge",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "lastVoted",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "length",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "modelVote",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "models",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_tokenId",
        type: "uint256",
      },
    ],
    name: "poke",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_tokenId",
        type: "uint256",
      },
    ],
    name: "reset",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_model",
        type: "bytes32",
      },
    ],
    name: "reviveGauge",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "targetArtifactSelectors",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "artifact",
            type: "string",
          },
          {
            internalType: "bytes4[]",
            name: "selectors",
            type: "bytes4[]",
          },
        ],
        internalType: "struct StdInvariant.FuzzArtifactSelector[]",
        name: "targetedArtifactSelectors_",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "targetArtifacts",
    outputs: [
      {
        internalType: "string[]",
        name: "targetedArtifacts_",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "targetContracts",
    outputs: [
      {
        internalType: "address[]",
        name: "targetedContracts_",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "targetInterfaces",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "addr",
            type: "address",
          },
          {
            internalType: "string[]",
            name: "artifacts",
            type: "string[]",
          },
        ],
        internalType: "struct StdInvariant.FuzzInterface[]",
        name: "targetedInterfaces_",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "targetSelectors",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "addr",
            type: "address",
          },
          {
            internalType: "bytes4[]",
            name: "selectors",
            type: "bytes4[]",
          },
        ],
        internalType: "struct StdInvariant.FuzzSelector[]",
        name: "targetedSelectors_",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "targetSenders",
    outputs: [
      {
        internalType: "address[]",
        name: "targetedSenders_",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalWeight",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "usedWeights",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bytes32[]",
        name: "_modelVote",
        type: "bytes32[]",
      },
      {
        internalType: "uint256[]",
        name: "_weights",
        type: "uint256[]",
      },
    ],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "votes",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "votingEscrow",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "weights",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_model",
        type: "bytes32",
      },
    ],
    name: "whitelist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x60a0346100e857601f6121ab38819003918201601f19168301916001600160401b038311848410176100ed578084926020946040528339810103126100e857516001600160a01b039081811681036100e8576000543360018060a01b0319821617600055604051923391167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0600080a3600160ff198181600d541617600d55601f541617601f556080526120a790816101048239608051818181610d3301528181610fc101528181611339015281816117d9015281816119b901528181611a360152611a810152f35b600080fd5b634e487b7160e01b600052604160045260246000fdfe608060408181526004918236101561001657600080fd5b600092833560e01c91826301a5e3fe14611495575081630c295755146112945781631b8dd060146112675781631ed7831c146111e45781631f7b6d32146111c55781632ade388014611053578163310bd74b14610f4a57816332145f9014610e685781633e5e3c2314610de55781633f7286f414610d625781634f2bfe5b14610d1e578163591e558214610c335781635a1fdbc014610bed5781635b0c8a6314610bbc57816366d9a9a014610a9d5781636a030ca914610a4f578163715018a6146109f557816379e93824146109cd5781637addf675146109a55781637eca406f1461094157816382fe6eae1461089d57816385226c811461080a5781638da5cb5b146107e2578163916a17c6146106ca57816396c82e57146106ac578163afb40c8e1461060c578163b5508aa914610579578163b65a78b51461054c578163ba414fa614610526578163e20c9f7114610492578163ecc44a381461042d578163f2fde38b14610362578163f3594be01461033a578163f9315157146101cc575063fa7626d4146101a657600080fd5b346101c857816003193601126101c85760209060ff601f541690519015158152f35b5080fd5b8383346101c857602080600319360112610336578335918284526023825260ff818520541661030a5783546001600160a01b031633036102c6575b8284526029825280842060ff199060018282541617905560238352600182862091825416179055602254600160401b8110156102b35760018101806022558110156102a05790837f77876d089a7d38cac3b6e288e4ca85feb58464def721da44f6a7c2a00583f3d09392602287527f61035b26e3e9eee00e0d72fd1ee8ddca6894550dca6916ea2ac6baa90d11e510015551338152a280f35b634e487b7160e01b855260328652602485fd5b634e487b7160e01b855260418652602485fd5b8284526028825260ff8185205416610207575162461bcd60e51b815280850191909152600c60248201526b085dda1a5d195b1a5cdd195960a21b6044820152606490fd5b5162461bcd60e51b815280850191909152600660248201526565786973747360d01b6044820152606490fd5b8280fd5b9050346103365760203660031901126103365760209282913581526027845220549051908152f35b91905034610336576020366003190112610336576001600160a01b0382358181169391929084900361042957610396611641565b83156103d757505082546001600160a01b0319811683178455167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08380a380f35b906020608492519162461bcd60e51b8352820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201526564647265737360d01b6064820152fd5b8480fd5b8383346101c857816003193601126101c85762093a8091824204928084029380850482149015171561047f57830180931161046c576020838351908152f35b634e487b7160e01b815260118452602490fd5b634e487b7160e01b825260118552602482fd5b8284346105235780600319360112610523578151918291601654808552602080950194601683527fd833147d7dc355ba459fc788f669e58cfaf9dc25ddcd0702e87d69c7b512428992905b828210610503576104ff86866104f5828b038361175f565b51918291826114f5565b0390f35b83546001600160a01b0316875295860195600193840193909101906104dd565b80fd5b5050346101c857816003193601126101c857602090610543611d24565b90519015158152f35b905034610336576020366003190112610336578160209360ff923581526023855220541690519015158152f35b828434610523578060031936011261052357601a54916105988361195d565b926105a58251948561175f565b808452601a83526020927f057c384a7d1c54f3a1b2e5e67b2617b8224fdfd1ea7234eea573a6ff665ff63e848087015b8484106105ee578551828152806104ff8185018b611579565b60019182916105fc85611dc5565b81520192019201919085906105d5565b919050346103365760203660031901126103365781359161062b611641565b828452602860205260ff828520541661067c575081835260286020528220805460ff19166001179055337fc27d38ad1bdb4164d72e05492b5ce6099b4169e9f20b41d3c7cf35c114a64d5b8380a380f35b6020606492519162461bcd60e51b8352820152600b60248201526a1dda1a5d195b1a5cdd195960aa1b6044820152fd5b5050346101c857816003193601126101c85760209081549051908152f35b828434610523578060031936011261052357601d546106e88161195d565b916106f58451938461175f565b818352601d815260209283810192827f6d4407e7be21f808e6509aa9fa9143369579dd7d760fe20a2c09680fc146134f855b8383106107a157505050508451938085019181865251809252858501868360051b8701019493965b83881061075c5786860387f35b90919293948380610790600193603f198b820301875285838b51878060a01b03815116845201519181858201520190611603565b97019301970196909392919361074f565b6002886001928b9a97989a516107b681611719565b848060a01b0386541681526107cc858701611e96565b8382015281520192019201919096949396610727565b5050346101c857816003193601126101c857905490516001600160a01b039091168152602090f35b828434610523578060031936011261052357601b54916108298361195d565b926108368251948561175f565b808452601b83526020927f3ad8aa4f87544323a9d1e5dd902f40c356527a7955687113db5f9a85ad579dc1848087015b84841061087f578551828152806104ff8185018b611579565b600191829161088d85611dc5565b8152019201920191908590610866565b91905034610336576020366003190112610336578135916108bc611641565b828452602960205260ff82852054161561090a575081835260296020528220805460ff191690557fd74a749bb4df681cf3299934daed7f425a12566ad01c4cba314166599b3632e58280a280f35b6020606492519162461bcd60e51b8352820152601260248201527119d85d59d948185b1c9958591e481919585960721b6044820152fd5b828434610523576020366003190112610523578235815260216020528181205492670de0b6b3a7640000938481029481860414901517156109925760208361098b86835490611699565b9051908152f35b634e487b7160e01b825260119052602490fd5b9050346103365760203660031901126103365760209282913581526021845220549051908152f35b9050346103365760203660031901126103365760209282913581526026845220549051908152f35b8334610523578060031936011261052357610a0e611641565b80546001600160a01b03198116825581906001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08280a380f35b9050346103365760203660031901126103365735602254811015610336576022602093527f61035b26e3e9eee00e0d72fd1ee8ddca6894550dca6916ea2ac6baa90d11e51001549051908152f35b828434610523578060031936011261052357601c54610abb8161195d565b91610ac88451938461175f565b818352601c815260209283810192827f0e4562a10381dec21b205ed72637e6b1b523bdd0e4d4d50af5cd23dd4500a211855b838310610b7b57505050508451938085019181865251809252858501868360051b8701019493965b838810610b2f5786860387f35b90919293948380610b6a600193603f198b820301875289519083610b5a835189845289840190611539565b9201519084818403910152611603565b970193019701969093929193610b22565b6002886001928b9a97989a51610b9081611719565b610b9986611dc5565b8152610ba6858701611e96565b8382015281520192019201919096949396610afa565b9050346103365781600319360112610336576020928291358152602484528181206024358252845220549051908152f35b8284346105235781600319360112610523576024359235815260256020528181209081548410156105235750602092610c25916115d5565b91905490519160031b1c8152f35b9190503461033657602080600319360112610d1a57823592610c53611641565b8385526023825260ff838620541615610ceb578385526029825260ff8386205416610cb45750828452602990528220805460ff191660011790557fdc036edc2c876189d8f78d214d657d28a486b78851be01e52717181f351b08338280a280f35b915162461bcd60e51b8152918201526013602482015272676175676520616c726561647920616c69766560681b6044820152606490fd5b915162461bcd60e51b815291820152600b60248201526a6e6f74206120676175676560a81b6044820152606490fd5b8380fd5b5050346101c857816003193601126101c857517f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03168152602090f35b8284346105235780600319360112610523578151918291601854808552602080950194601883527fb13d2d76d1f4b7be834882e410b3e3a8afaf69f83600ae24db354391d2378d2e92905b828210610dc5576104ff86866104f5828b038361175f565b83546001600160a01b031687529586019560019384019390910190610dad565b8284346105235780600319360112610523578151918291601954808552602080950194601983527f944998273e477b495144fb8794c914197f3ccb46be2900f4698fd0ef743c969592905b828210610e48576104ff86866104f5828b038361175f565b83546001600160a01b031687529586019560019384019390910190610e30565b839150346101c8576020908160031936011261033657359283835260258252808320908051808385829554938481520190875285872092875b87828210610f3457505050610eb89250038361175f565b815190610ec48261195d565b93610ed18251958661175f565b828552601f19610ee08461195d565b013682870137855b838110610efe5786610efb87878b611989565b80f35b610f2f9088885260248352838820610f168288611975565b518952835283882054610f298289611975565b52611799565b610ee8565b8554845260019586019588955093019201610ea1565b919050346103365760203660031901126103365781359162093a808042048181029181830414901517156110405783610fbd92610f946020938389526027855286892054106116dc565b845163430c208160e01b8152339181019182526020820192909252909283918291604090910190565b03817f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03165afa91821561103757508391611009575b50156101c857610efb906117b5565b61102a915060203d8111611030575b611022818361175f565b810190611781565b38610ffa565b503d611018565b513d85823e3d90fd5b634e487b7160e01b855260118252602485fd5b828434610523578060031936011261052357601e546110718161195d565b9161107e8451938461175f565b8183526020928381018093601e84527f50bb669a95c7b50b7e8a6f09454034b2b14cf2b85c730dca9a539ca82cb6e35084925b82841061112b57505050508451938085019181865251809252858501868360051b8701019493965b8388106110e65786860387f35b9091929394838061111a600193603f198b820301875285838b51878060a01b03815116845201519181858201520190611579565b9701930197019690939291936110d9565b8789989596985161113b81611719565b83546001600160a01b03168152600184810180548d92918d906111696111608461195d565b9551958661175f565b8285528152858120908685015b8382106111a0575050505050928160019484600295940152815201920193019290969493966110b1565b93809596978394956111b3839495611dc5565b815201930191018b9695949392611176565b5050346101c857816003193601126101c8576020906022549051908152f35b8284346105235780600319360112610523578151918291601754808552602080950194601783527fc624b66cc0138b8fabc209247f72d758e1cf3343756d543badbf24212bed8c1592905b828210611247576104ff86866104f5828b038361175f565b83546001600160a01b03168752958601956001938401939091019061122f565b905034610336576020366003190112610336578160209360ff923581526029855220541690519015158152f35b8383346101c85760603660031901126101c85767ffffffffffffffff8335602435828111610429576112c990369087016114bf565b92604435908111611491576112e190369088016114bf565b909162093a809788420489810299818b04149015171561147e5784885261131260209960278b52888a2054106116dc565b865163430c208160e01b815233828201908152602081018790528a908290819060400103817f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03165afa908115611474578991611457575b50156114535782860361141e57508387526027885242868820556113948561195d565b946113a18751968761175f565b8086528886019060051b82019136831161141a5789915b83821061140b57505050506113cf6111608261195d565b8085528685019060051b82019136831161140757905b8282106113f85786610efb878787611989565b813581529087019087016113e5565b8680fd5b813581529082019082016113b8565b8880fd5b865162461bcd60e51b8152908101899052600f60248201526e0d8cadccee8d040dad2e6dac2e8c6d608b1b6044820152606490fd5b8780fd5b61146e91508a3d8c1161103057611022818361175f565b8a611371565b88513d8b823e3d90fd5b634e487b7160e01b885260119052602487fd5b8580fd5b92915034610d1a576020366003190112610d1a573583526028602090815292205460ff1615158152f35b9181601f840112156114f05782359167ffffffffffffffff83116114f0576020808501948460051b0101116114f057565b600080fd5b6020908160408183019282815285518094520193019160005b82811061151c575050505090565b83516001600160a01b03168552938101939281019260010161150e565b919082519283825260005b848110611565575050826000602080949584010152601f8019910116010190565b602081830181015184830182015201611544565b908082519081815260208091019281808460051b8301019501936000915b8483106115a75750505050505090565b90919293949584806115c5600193601f198682030187528a51611539565b9801930193019194939290611597565b80548210156115ed5760005260206000200190600090565b634e487b7160e01b600052603260045260246000fd5b90815180825260208080930193019160005b828110611623575050505090565b83516001600160e01b03191685529381019392810192600101611615565b6000546001600160a01b0316330361165557565b606460405162461bcd60e51b815260206004820152602060248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e65726044820152fd5b81156116a3570490565b634e487b7160e01b600052601260045260246000fd5b919082018092116116c657565b634e487b7160e01b600052601160045260246000fd5b156116e357565b60405162461bcd60e51b815260206004820152600e60248201526d0dedcd8f240dccaee40cae0dec6d60931b6044820152606490fd5b6040810190811067ffffffffffffffff82111761173557604052565b634e487b7160e01b600052604160045260246000fd5b67ffffffffffffffff811161173557604052565b90601f8019910116810190811067ffffffffffffffff82111761173557604052565b908160209103126114f0575180151581036114f05790565b60001981146116c65760010190565b919082039182116116c657565b6000908082526020906025825260409081842080548591865b8281106118a55750507f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169050803b1561149157858091602486518094819363c1f0fb9f60e01b83528860048401525af1801561189b57611886575b5061183e9084546117a8565b835583526026825282818120556025825282209182549281815583611864575b50505050565b815220908101905b81811061187a57808061185e565b6000815560010161186c565b9461189461183e929661174b565b9490611832565b84513d88823e3d90fd5b6118af81836115d5565b90549060031b1c8589528689602492838b528282208183528b5282822054938b8a866118eb575b505050505050506118e690611799565b6117ce565b9361194593879b9293847fa9f3ca5f8a9e1580edb2741e0ba560084ec72e0067ba3423f9e9327a176882db989760216118e69c9b975288852061192f8882546117a8565b905584525285822091528d528d848120556116b9565b968151908982528b820152a190868938808b8a6118d6565b67ffffffffffffffff81116117355760051b60200190565b80518210156115ed5760209160051b010190565b9291611994846117b5565b81516040516339f890b560e21b815260048101869052946000929091906020876024817f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03165afa968715611d19578497611ce5575b508384978596865b858110611cc15750865b858110611ae65750505050505082611a34575b611a2660409394956020546116b9565b602055815260266020522055565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03163b156101c85760405163fd4a77f160e01b815260048101829052948286602481837f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03165af1958615611adb576040949596611ac6575b5094939250611a16565b92611ad4611a26929461174b565b9290611abc565b6040513d85823e3d90fd5b611af08183611975565b51808952602960205260ff60408a205416611b15575b50611b1090611799565b611a03565b611b2282879d9b9d611975565b518085810204851481151715611cad578585611b3e9202611699565b9b888a52602460205260408a20828b5260205260408a2054611c78578c15611c4557888a52602560205260408a20805490600160401b821015611c3157611bed8f611b1096959460408f8f611b9d8886986001611bf39b0181556115d5565b81549060031b908b821b91600019901b19161790558882526021602052828220611bc88682546116b9565b90558152602460205281812088825260205220611be68382546116b9565b90556116b9565b9c6116b9565b9c604051918a8352602083015260408201527f51d9b06f0a770c3d095eae34a710cd6cd036a1dde5859060f74e233d3d7f2dfc60603392a290611b06565b634e487b7160e01b8c52604160045260248cfd5b60405162461bcd60e51b815260206004820152600b60248201526a1e995c9bc81dd95a59da1d60aa1b6044820152606490fd5b60405162461bcd60e51b815260206004820152600d60248201526c6e6f6e7a65726f20766f74657360981b6044820152606490fd5b634e487b7160e01b8a52601160045260248afd5b92611cda611ce091611cd38688611975565b51906116b9565b93611799565b6119f9565b9096506020813d602011611d11575b81611d016020938361175f565b81010312610d1a575195386119f1565b3d9150611cf4565b6040513d86823e3d90fd5b60095460ff168015611d335790565b50604051630667f9d760e41b8152602081604481737109709ecfa91a80626ff3989d68f67f5b1dd12d8060048301526519985a5b195960d21b60248301525afa908115611db957600091611d88575b50151590565b906020823d8211611db1575b81611da16020938361175f565b8101031261052357505138611d82565b3d9150611d94565b6040513d6000823e3d90fd5b90604051906000835490600182811c90808416968715611e8c575b6020948584108914611e785787988489979899529081600014611e565750600114611e17575b505050611e159250038361175f565b565b600090815285812095935091905b818310611e3e575050611e159350820101388080611e06565b85548884018501529485019487945091830191611e25565b92505050611e1594925060ff191682840152151560051b820101388080611e06565b634e487b7160e01b85526022600452602485fd5b91607f1691611de0565b906040918251809382549283835260209182840191600052826000209460005b816007820110611ffe5784611e15975493838310611fde575b838310611fbe575b838310611f9e575b838310611f7e575b838310611f5e575b838310611f41575b50828210611f25575b5010611f11575b509050038361175f565b6001600160e01b0319168152018038611f07565b83811b6001600160e01b03191685529093019260010184611f00565b84901b6001600160e01b0319168552909301926001018438611ef7565b606085901b6001600160e01b031916865294810194600190920191611eef565b608085901b6001600160e01b031916865294810194600190920191611ee7565b60a085901b6001600160e01b031916865294810194600190920191611edf565b60c085901b6001600160e01b031916865294810194600190920191611ed7565b60e085901b6001600160e01b031916865294810194600190920191611ecf565b86546001600160e01b031960e082811b8216875260c083811b83168989015260a084811b8416888a0152608085811b85166060808c019190915286901b8516908a015284881b84169089015283891b83169088015291169085015260019096019588955061010090930192600801611eb656fea264697066735822122030ae29a551cf3f73abb2edb3a02cd9087b3bef52bea1835254a66bda0dd4c05564736f6c63430008130033";

type VoterConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: VoterConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Voter__factory extends ContractFactory {
  constructor(...args: VoterConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _votingEscrow: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<Voter> {
    return super.deploy(_votingEscrow, overrides || {}) as Promise<Voter>;
  }
  override getDeployTransaction(
    _votingEscrow: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_votingEscrow, overrides || {});
  }
  override attach(address: string): Voter {
    return super.attach(address) as Voter;
  }
  override connect(signer: Signer): Voter__factory {
    return super.connect(signer) as Voter__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): VoterInterface {
    return new utils.Interface(_abi) as VoterInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): Voter {
    return new Contract(address, _abi, signerOrProvider) as Voter;
  }
}