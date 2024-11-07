/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../common";
import type {
  LookupContestationValidator,
  LookupContestationValidatorInterface,
} from "../../../contracts/Example/LookupContestationValidator";

const _abi = [
  {
    inputs: [
      {
        internalType: "contract IArbius",
        name: "_arbius",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "taskid",
        type: "bytes32",
      },
    ],
    name: "lookupContestationValidator",
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
  "0x60803461007457601f61020338819003918201601f19168301916001600160401b038311848410176100795780849260209460405283398101031261007457516001600160a01b0381169081900361007457600080546001600160a01b03191691909117905560405161017390816100908239f35b600080fd5b634e487b7160e01b600052604160045260246000fdfe60806040818152600436101561001457600080fd5b600091823560e01c63337d62a21461002b57600080fd5b346101395760203660031901126101395760018060a01b03906060816024818588541663d33b2ef560e01b825260043560048301525afa90811561012c57849161007e575b506020935051169051908152f35b905060603d8111610125575b601f8101601f19168201916001600160401b0391828411828510176101115781606091810103126101095760608301838110838211176101115785528051848116810361010d578352602081015191821682036101095784916020840152015163ffffffff8116810361010557602094508382015238610070565b8480fd5b8580fd5b8680fd5b634e487b7160e01b87526041600452602487fd5b503d61008a565b50505051903d90823e3d90fd5b8280fdfea2646970667358221220aad1be6e56c6ae5f802292810d90d9d712172b8bc94cb89fcbbcdb15509e017264736f6c63430008130033";

type LookupContestationValidatorConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: LookupContestationValidatorConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class LookupContestationValidator__factory extends ContractFactory {
  constructor(...args: LookupContestationValidatorConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _arbius: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<LookupContestationValidator> {
    return super.deploy(
      _arbius,
      overrides || {}
    ) as Promise<LookupContestationValidator>;
  }
  override getDeployTransaction(
    _arbius: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_arbius, overrides || {});
  }
  override attach(address: string): LookupContestationValidator {
    return super.attach(address) as LookupContestationValidator;
  }
  override connect(signer: Signer): LookupContestationValidator__factory {
    return super.connect(signer) as LookupContestationValidator__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): LookupContestationValidatorInterface {
    return new utils.Interface(_abi) as LookupContestationValidatorInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): LookupContestationValidator {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as LookupContestationValidator;
  }
}