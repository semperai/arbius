/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../common";

export interface IL1CustomGatewayInterface extends utils.Interface {
  functions: {
    "registerTokenToL2(address,uint256,uint256,uint256,address)": FunctionFragment;
  };

  getFunction(nameOrSignatureOrTopic: "registerTokenToL2"): FunctionFragment;

  encodeFunctionData(
    functionFragment: "registerTokenToL2",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<string>
    ]
  ): string;

  decodeFunctionResult(
    functionFragment: "registerTokenToL2",
    data: BytesLike
  ): Result;

  events: {};
}

export interface IL1CustomGateway extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IL1CustomGatewayInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    registerTokenToL2(
      _l2Address: PromiseOrValue<string>,
      _maxGas: PromiseOrValue<BigNumberish>,
      _gasPriceBid: PromiseOrValue<BigNumberish>,
      _maxSubmissionCost: PromiseOrValue<BigNumberish>,
      _creditBackAddress: PromiseOrValue<string>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  registerTokenToL2(
    _l2Address: PromiseOrValue<string>,
    _maxGas: PromiseOrValue<BigNumberish>,
    _gasPriceBid: PromiseOrValue<BigNumberish>,
    _maxSubmissionCost: PromiseOrValue<BigNumberish>,
    _creditBackAddress: PromiseOrValue<string>,
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    registerTokenToL2(
      _l2Address: PromiseOrValue<string>,
      _maxGas: PromiseOrValue<BigNumberish>,
      _gasPriceBid: PromiseOrValue<BigNumberish>,
      _maxSubmissionCost: PromiseOrValue<BigNumberish>,
      _creditBackAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  filters: {};

  estimateGas: {
    registerTokenToL2(
      _l2Address: PromiseOrValue<string>,
      _maxGas: PromiseOrValue<BigNumberish>,
      _gasPriceBid: PromiseOrValue<BigNumberish>,
      _maxSubmissionCost: PromiseOrValue<BigNumberish>,
      _creditBackAddress: PromiseOrValue<string>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    registerTokenToL2(
      _l2Address: PromiseOrValue<string>,
      _maxGas: PromiseOrValue<BigNumberish>,
      _gasPriceBid: PromiseOrValue<BigNumberish>,
      _maxSubmissionCost: PromiseOrValue<BigNumberish>,
      _creditBackAddress: PromiseOrValue<string>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}