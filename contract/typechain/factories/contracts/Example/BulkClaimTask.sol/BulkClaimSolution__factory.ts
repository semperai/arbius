/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../common";
import type {
  BulkClaimSolution,
  BulkClaimSolutionInterface,
} from "../../../../contracts/Example/BulkClaimTask.sol/BulkClaimSolution";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "engine_",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "bytes32[]",
        name: "taskids_",
        type: "bytes32[]",
      },
      {
        internalType: "uint256",
        name: "gas_",
        type: "uint256",
      },
    ],
    name: "claimSolutionBulk",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "engine",
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
] as const;

const _bytecode =
  "0x60803461007457601f61028538819003918201601f19168301916001600160401b038311848410176100795780849260209460405283398101031261007457516001600160a01b0381169081900361007457600080546001600160a01b0319169190911790556040516101f590816100908239f35b600080fd5b634e487b7160e01b600052604160045260246000fdfe6040608081526004908136101561001557600080fd5b600091823560e01c90816304c5783a14610063575063c9d4623f1461003957600080fd5b3461005f578160031936011261005f57905490516001600160a01b039091168152602090f35b5080fd5b9050346101bb57816003193601126101bb576001600160401b0391813591908383116101b757366023840112156101b75782820135928484116101b3576024946005368787831b850101116101af578697963590875b8781106100c4578880f35b85516377286d1760e01b602080830191825283851b88018d01358d8401528c8352918b91606082018881118382101761019d578a5282549151839290919083906001600160a01b031689f1503d15610194573d9085821161018257875191601f19603f81601f84011601168301838110888211176101705789528252999a993d918c91013e5b600019811461015e576001019897986100b9565b634e487b7160e01b8a5260118752888afd5b634e487b7160e01b8d5260418b528d8dfd5b634e487b7160e01b8b52604189528b8bfd5b5098979861014a565b634e487b7160e01b845260418c528e84fd5b8780fd5b8580fd5b8480fd5b8280fdfea26469706673582212202672147f1e1f04f9863866d0869ba4756102755311ca51e4462a2e9a67ed1c8064736f6c63430008130033";

type BulkClaimSolutionConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: BulkClaimSolutionConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class BulkClaimSolution__factory extends ContractFactory {
  constructor(...args: BulkClaimSolutionConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    engine_: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<BulkClaimSolution> {
    return super.deploy(engine_, overrides || {}) as Promise<BulkClaimSolution>;
  }
  override getDeployTransaction(
    engine_: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(engine_, overrides || {});
  }
  override attach(address: string): BulkClaimSolution {
    return super.attach(address) as BulkClaimSolution;
  }
  override connect(signer: Signer): BulkClaimSolution__factory {
    return super.connect(signer) as BulkClaimSolution__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): BulkClaimSolutionInterface {
    return new utils.Interface(_abi) as BulkClaimSolutionInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): BulkClaimSolution {
    return new Contract(address, _abi, signerOrProvider) as BulkClaimSolution;
  }
}
