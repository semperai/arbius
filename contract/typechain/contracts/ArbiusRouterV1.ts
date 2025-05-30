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
  Overrides,
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../common";

export type SignatureStruct = {
  signer: PromiseOrValue<string>;
  signature: PromiseOrValue<BytesLike>;
};

export type SignatureStructOutput = [string, string] & {
  signer: string;
  signature: string;
};

export interface ArbiusRouterV1Interface extends utils.Interface {
  functions: {
    "addIncentive(bytes32,uint256)": FunctionFragment;
    "arbius()": FunctionFragment;
    "bulkClaimIncentive(bytes32[],(address,bytes)[],uint256)": FunctionFragment;
    "claimIncentive(bytes32,(address,bytes)[])": FunctionFragment;
    "emergencyClaimIncentive(bytes32)": FunctionFragment;
    "engine()": FunctionFragment;
    "incentives(bytes32)": FunctionFragment;
    "minValidators()": FunctionFragment;
    "owner()": FunctionFragment;
    "receiver()": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "router()": FunctionFragment;
    "setMinValidators(uint256)": FunctionFragment;
    "setValidator(address,bool)": FunctionFragment;
    "submitTask(uint8,address,bytes32,uint256,bytes,uint256,uint256)": FunctionFragment;
    "submitTaskWithETH(uint8,address,bytes32,uint256,bytes,uint256,uint256)": FunctionFragment;
    "submitTaskWithToken(uint8,address,bytes32,uint256,bytes,uint256,address,uint256,uint256)": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
    "uniswapApprove(address)": FunctionFragment;
    "validateSignatures(bytes32,(address,bytes)[])": FunctionFragment;
    "validators(address)": FunctionFragment;
    "withdraw(address)": FunctionFragment;
    "withdrawETH()": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "addIncentive"
      | "arbius"
      | "bulkClaimIncentive"
      | "claimIncentive"
      | "emergencyClaimIncentive"
      | "engine"
      | "incentives"
      | "minValidators"
      | "owner"
      | "receiver"
      | "renounceOwnership"
      | "router"
      | "setMinValidators"
      | "setValidator"
      | "submitTask"
      | "submitTaskWithETH"
      | "submitTaskWithToken"
      | "transferOwnership"
      | "uniswapApprove"
      | "validateSignatures"
      | "validators"
      | "withdraw"
      | "withdrawETH"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "addIncentive",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(functionFragment: "arbius", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "bulkClaimIncentive",
    values: [
      PromiseOrValue<BytesLike>[],
      SignatureStruct[],
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "claimIncentive",
    values: [PromiseOrValue<BytesLike>, SignatureStruct[]]
  ): string;
  encodeFunctionData(
    functionFragment: "emergencyClaimIncentive",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(functionFragment: "engine", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "incentives",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "minValidators",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(functionFragment: "receiver", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "router", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "setMinValidators",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "setValidator",
    values: [PromiseOrValue<string>, PromiseOrValue<boolean>]
  ): string;
  encodeFunctionData(
    functionFragment: "submitTask",
    values: [
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<string>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "submitTaskWithETH",
    values: [
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<string>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "submitTaskWithToken",
    values: [
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<string>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "uniswapApprove",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "validateSignatures",
    values: [PromiseOrValue<BytesLike>, SignatureStruct[]]
  ): string;
  encodeFunctionData(
    functionFragment: "validators",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "withdraw",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "withdrawETH",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "addIncentive",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "arbius", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "bulkClaimIncentive",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "claimIncentive",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "emergencyClaimIncentive",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "engine", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "incentives", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "minValidators",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "receiver", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "router", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setMinValidators",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setValidator",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "submitTask", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "submitTaskWithETH",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "submitTaskWithToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "uniswapApprove",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "validateSignatures",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "validators", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "withdrawETH",
    data: BytesLike
  ): Result;

  events: {
    "IncentiveAdded(bytes32,uint256)": EventFragment;
    "IncentiveClaimed(bytes32,address,uint256)": EventFragment;
    "MinValidatorsSet(uint256)": EventFragment;
    "OwnershipTransferred(address,address)": EventFragment;
    "ValidatorSet(address,bool)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "IncentiveAdded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "IncentiveClaimed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "MinValidatorsSet"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ValidatorSet"): EventFragment;
}

export interface IncentiveAddedEventObject {
  taskid: string;
  amount: BigNumber;
}
export type IncentiveAddedEvent = TypedEvent<
  [string, BigNumber],
  IncentiveAddedEventObject
>;

export type IncentiveAddedEventFilter = TypedEventFilter<IncentiveAddedEvent>;

export interface IncentiveClaimedEventObject {
  taskid: string;
  recipient: string;
  amount: BigNumber;
}
export type IncentiveClaimedEvent = TypedEvent<
  [string, string, BigNumber],
  IncentiveClaimedEventObject
>;

export type IncentiveClaimedEventFilter =
  TypedEventFilter<IncentiveClaimedEvent>;

export interface MinValidatorsSetEventObject {
  minValidators: BigNumber;
}
export type MinValidatorsSetEvent = TypedEvent<
  [BigNumber],
  MinValidatorsSetEventObject
>;

export type MinValidatorsSetEventFilter =
  TypedEventFilter<MinValidatorsSetEvent>;

export interface OwnershipTransferredEventObject {
  previousOwner: string;
  newOwner: string;
}
export type OwnershipTransferredEvent = TypedEvent<
  [string, string],
  OwnershipTransferredEventObject
>;

export type OwnershipTransferredEventFilter =
  TypedEventFilter<OwnershipTransferredEvent>;

export interface ValidatorSetEventObject {
  validator: string;
  status: boolean;
}
export type ValidatorSetEvent = TypedEvent<
  [string, boolean],
  ValidatorSetEventObject
>;

export type ValidatorSetEventFilter = TypedEventFilter<ValidatorSetEvent>;

export interface ArbiusRouterV1 extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: ArbiusRouterV1Interface;

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
    addIncentive(
      taskid_: PromiseOrValue<BytesLike>,
      amount_: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    arbius(overrides?: CallOverrides): Promise<[string]>;

    bulkClaimIncentive(
      taskids_: PromiseOrValue<BytesLike>[],
      sigs_: SignatureStruct[],
      sigsPerTask_: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    claimIncentive(
      taskid_: PromiseOrValue<BytesLike>,
      sigs_: SignatureStruct[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    emergencyClaimIncentive(
      taskid_: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    engine(overrides?: CallOverrides): Promise<[string]>;

    incentives(
      arg0: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    minValidators(overrides?: CallOverrides): Promise<[BigNumber]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    receiver(overrides?: CallOverrides): Promise<[string]>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    router(overrides?: CallOverrides): Promise<[string]>;

    setMinValidators(
      minValidators_: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setValidator(
      validator_: PromiseOrValue<string>,
      status_: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    submitTask(
      version_: PromiseOrValue<BigNumberish>,
      owner_: PromiseOrValue<string>,
      model_: PromiseOrValue<BytesLike>,
      fee_: PromiseOrValue<BigNumberish>,
      input_: PromiseOrValue<BytesLike>,
      incentive_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    submitTaskWithETH(
      version_: PromiseOrValue<BigNumberish>,
      owner_: PromiseOrValue<string>,
      model_: PromiseOrValue<BytesLike>,
      fee_: PromiseOrValue<BigNumberish>,
      input_: PromiseOrValue<BytesLike>,
      incentive_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    submitTaskWithToken(
      version_: PromiseOrValue<BigNumberish>,
      owner_: PromiseOrValue<string>,
      model_: PromiseOrValue<BytesLike>,
      fee_: PromiseOrValue<BigNumberish>,
      input_: PromiseOrValue<BytesLike>,
      incentive_: PromiseOrValue<BigNumberish>,
      token_: PromiseOrValue<string>,
      amountInMax_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    uniswapApprove(
      token_: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    validateSignatures(
      hash_: PromiseOrValue<BytesLike>,
      sigs_: SignatureStruct[],
      overrides?: CallOverrides
    ): Promise<[void]>;

    validators(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    withdraw(
      token_: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    withdrawETH(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  addIncentive(
    taskid_: PromiseOrValue<BytesLike>,
    amount_: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  arbius(overrides?: CallOverrides): Promise<string>;

  bulkClaimIncentive(
    taskids_: PromiseOrValue<BytesLike>[],
    sigs_: SignatureStruct[],
    sigsPerTask_: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  claimIncentive(
    taskid_: PromiseOrValue<BytesLike>,
    sigs_: SignatureStruct[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  emergencyClaimIncentive(
    taskid_: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  engine(overrides?: CallOverrides): Promise<string>;

  incentives(
    arg0: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  minValidators(overrides?: CallOverrides): Promise<BigNumber>;

  owner(overrides?: CallOverrides): Promise<string>;

  receiver(overrides?: CallOverrides): Promise<string>;

  renounceOwnership(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  router(overrides?: CallOverrides): Promise<string>;

  setMinValidators(
    minValidators_: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setValidator(
    validator_: PromiseOrValue<string>,
    status_: PromiseOrValue<boolean>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  submitTask(
    version_: PromiseOrValue<BigNumberish>,
    owner_: PromiseOrValue<string>,
    model_: PromiseOrValue<BytesLike>,
    fee_: PromiseOrValue<BigNumberish>,
    input_: PromiseOrValue<BytesLike>,
    incentive_: PromiseOrValue<BigNumberish>,
    gas_: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  submitTaskWithETH(
    version_: PromiseOrValue<BigNumberish>,
    owner_: PromiseOrValue<string>,
    model_: PromiseOrValue<BytesLike>,
    fee_: PromiseOrValue<BigNumberish>,
    input_: PromiseOrValue<BytesLike>,
    incentive_: PromiseOrValue<BigNumberish>,
    gas_: PromiseOrValue<BigNumberish>,
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  submitTaskWithToken(
    version_: PromiseOrValue<BigNumberish>,
    owner_: PromiseOrValue<string>,
    model_: PromiseOrValue<BytesLike>,
    fee_: PromiseOrValue<BigNumberish>,
    input_: PromiseOrValue<BytesLike>,
    incentive_: PromiseOrValue<BigNumberish>,
    token_: PromiseOrValue<string>,
    amountInMax_: PromiseOrValue<BigNumberish>,
    gas_: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  uniswapApprove(
    token_: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  validateSignatures(
    hash_: PromiseOrValue<BytesLike>,
    sigs_: SignatureStruct[],
    overrides?: CallOverrides
  ): Promise<void>;

  validators(
    arg0: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  withdraw(
    token_: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  withdrawETH(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    addIncentive(
      taskid_: PromiseOrValue<BytesLike>,
      amount_: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    arbius(overrides?: CallOverrides): Promise<string>;

    bulkClaimIncentive(
      taskids_: PromiseOrValue<BytesLike>[],
      sigs_: SignatureStruct[],
      sigsPerTask_: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    claimIncentive(
      taskid_: PromiseOrValue<BytesLike>,
      sigs_: SignatureStruct[],
      overrides?: CallOverrides
    ): Promise<void>;

    emergencyClaimIncentive(
      taskid_: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    engine(overrides?: CallOverrides): Promise<string>;

    incentives(
      arg0: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    minValidators(overrides?: CallOverrides): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<string>;

    receiver(overrides?: CallOverrides): Promise<string>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    router(overrides?: CallOverrides): Promise<string>;

    setMinValidators(
      minValidators_: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    setValidator(
      validator_: PromiseOrValue<string>,
      status_: PromiseOrValue<boolean>,
      overrides?: CallOverrides
    ): Promise<void>;

    submitTask(
      version_: PromiseOrValue<BigNumberish>,
      owner_: PromiseOrValue<string>,
      model_: PromiseOrValue<BytesLike>,
      fee_: PromiseOrValue<BigNumberish>,
      input_: PromiseOrValue<BytesLike>,
      incentive_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    submitTaskWithETH(
      version_: PromiseOrValue<BigNumberish>,
      owner_: PromiseOrValue<string>,
      model_: PromiseOrValue<BytesLike>,
      fee_: PromiseOrValue<BigNumberish>,
      input_: PromiseOrValue<BytesLike>,
      incentive_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    submitTaskWithToken(
      version_: PromiseOrValue<BigNumberish>,
      owner_: PromiseOrValue<string>,
      model_: PromiseOrValue<BytesLike>,
      fee_: PromiseOrValue<BigNumberish>,
      input_: PromiseOrValue<BytesLike>,
      incentive_: PromiseOrValue<BigNumberish>,
      token_: PromiseOrValue<string>,
      amountInMax_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    uniswapApprove(
      token_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    validateSignatures(
      hash_: PromiseOrValue<BytesLike>,
      sigs_: SignatureStruct[],
      overrides?: CallOverrides
    ): Promise<void>;

    validators(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    withdraw(
      token_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    withdrawETH(overrides?: CallOverrides): Promise<void>;
  };

  filters: {
    "IncentiveAdded(bytes32,uint256)"(
      taskid?: PromiseOrValue<BytesLike> | null,
      amount?: null
    ): IncentiveAddedEventFilter;
    IncentiveAdded(
      taskid?: PromiseOrValue<BytesLike> | null,
      amount?: null
    ): IncentiveAddedEventFilter;

    "IncentiveClaimed(bytes32,address,uint256)"(
      taskid?: PromiseOrValue<BytesLike> | null,
      recipient?: PromiseOrValue<string> | null,
      amount?: null
    ): IncentiveClaimedEventFilter;
    IncentiveClaimed(
      taskid?: PromiseOrValue<BytesLike> | null,
      recipient?: PromiseOrValue<string> | null,
      amount?: null
    ): IncentiveClaimedEventFilter;

    "MinValidatorsSet(uint256)"(
      minValidators?: null
    ): MinValidatorsSetEventFilter;
    MinValidatorsSet(minValidators?: null): MinValidatorsSetEventFilter;

    "OwnershipTransferred(address,address)"(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;
    OwnershipTransferred(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;

    "ValidatorSet(address,bool)"(
      validator?: PromiseOrValue<string> | null,
      status?: null
    ): ValidatorSetEventFilter;
    ValidatorSet(
      validator?: PromiseOrValue<string> | null,
      status?: null
    ): ValidatorSetEventFilter;
  };

  estimateGas: {
    addIncentive(
      taskid_: PromiseOrValue<BytesLike>,
      amount_: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    arbius(overrides?: CallOverrides): Promise<BigNumber>;

    bulkClaimIncentive(
      taskids_: PromiseOrValue<BytesLike>[],
      sigs_: SignatureStruct[],
      sigsPerTask_: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    claimIncentive(
      taskid_: PromiseOrValue<BytesLike>,
      sigs_: SignatureStruct[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    emergencyClaimIncentive(
      taskid_: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    engine(overrides?: CallOverrides): Promise<BigNumber>;

    incentives(
      arg0: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    minValidators(overrides?: CallOverrides): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    receiver(overrides?: CallOverrides): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    router(overrides?: CallOverrides): Promise<BigNumber>;

    setMinValidators(
      minValidators_: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setValidator(
      validator_: PromiseOrValue<string>,
      status_: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    submitTask(
      version_: PromiseOrValue<BigNumberish>,
      owner_: PromiseOrValue<string>,
      model_: PromiseOrValue<BytesLike>,
      fee_: PromiseOrValue<BigNumberish>,
      input_: PromiseOrValue<BytesLike>,
      incentive_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    submitTaskWithETH(
      version_: PromiseOrValue<BigNumberish>,
      owner_: PromiseOrValue<string>,
      model_: PromiseOrValue<BytesLike>,
      fee_: PromiseOrValue<BigNumberish>,
      input_: PromiseOrValue<BytesLike>,
      incentive_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    submitTaskWithToken(
      version_: PromiseOrValue<BigNumberish>,
      owner_: PromiseOrValue<string>,
      model_: PromiseOrValue<BytesLike>,
      fee_: PromiseOrValue<BigNumberish>,
      input_: PromiseOrValue<BytesLike>,
      incentive_: PromiseOrValue<BigNumberish>,
      token_: PromiseOrValue<string>,
      amountInMax_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    uniswapApprove(
      token_: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    validateSignatures(
      hash_: PromiseOrValue<BytesLike>,
      sigs_: SignatureStruct[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    validators(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    withdraw(
      token_: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    withdrawETH(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    addIncentive(
      taskid_: PromiseOrValue<BytesLike>,
      amount_: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    arbius(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    bulkClaimIncentive(
      taskids_: PromiseOrValue<BytesLike>[],
      sigs_: SignatureStruct[],
      sigsPerTask_: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    claimIncentive(
      taskid_: PromiseOrValue<BytesLike>,
      sigs_: SignatureStruct[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    emergencyClaimIncentive(
      taskid_: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    engine(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    incentives(
      arg0: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    minValidators(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    receiver(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    router(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    setMinValidators(
      minValidators_: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setValidator(
      validator_: PromiseOrValue<string>,
      status_: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    submitTask(
      version_: PromiseOrValue<BigNumberish>,
      owner_: PromiseOrValue<string>,
      model_: PromiseOrValue<BytesLike>,
      fee_: PromiseOrValue<BigNumberish>,
      input_: PromiseOrValue<BytesLike>,
      incentive_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    submitTaskWithETH(
      version_: PromiseOrValue<BigNumberish>,
      owner_: PromiseOrValue<string>,
      model_: PromiseOrValue<BytesLike>,
      fee_: PromiseOrValue<BigNumberish>,
      input_: PromiseOrValue<BytesLike>,
      incentive_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    submitTaskWithToken(
      version_: PromiseOrValue<BigNumberish>,
      owner_: PromiseOrValue<string>,
      model_: PromiseOrValue<BytesLike>,
      fee_: PromiseOrValue<BigNumberish>,
      input_: PromiseOrValue<BytesLike>,
      incentive_: PromiseOrValue<BigNumberish>,
      token_: PromiseOrValue<string>,
      amountInMax_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    uniswapApprove(
      token_: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    validateSignatures(
      hash_: PromiseOrValue<BytesLike>,
      sigs_: SignatureStruct[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    validators(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    withdraw(
      token_: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    withdrawETH(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
