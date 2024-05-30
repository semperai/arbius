/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import { FunctionFragment, Result } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";

export interface BulkSubmitTaskInterface extends utils.Interface {
  functions: {
    "engine()": FunctionFragment;
    "submitTaskBulk(uint8,address,bytes32,uint256,bytes,uint256,uint256)": FunctionFragment;
    "submitTaskBulkWithFee(uint8,address,bytes32,uint256,bytes,uint256,uint256,uint256)": FunctionFragment;
    "token()": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "engine", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "submitTaskBulk",
    values: [
      BigNumberish,
      string,
      BytesLike,
      BigNumberish,
      BytesLike,
      BigNumberish,
      BigNumberish
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "submitTaskBulkWithFee",
    values: [
      BigNumberish,
      string,
      BytesLike,
      BigNumberish,
      BytesLike,
      BigNumberish,
      BigNumberish,
      BigNumberish
    ]
  ): string;
  encodeFunctionData(functionFragment: "token", values?: undefined): string;

  decodeFunctionResult(functionFragment: "engine", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "submitTaskBulk",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "submitTaskBulkWithFee",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "token", data: BytesLike): Result;

  events: {};
}

export interface BulkSubmitTask extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: BulkSubmitTaskInterface;

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
    engine(overrides?: CallOverrides): Promise<[string]>;

    submitTaskBulk(
      version_: BigNumberish,
      owner_: string,
      model_: BytesLike,
      fee_: BigNumberish,
      input_: BytesLike,
      count_: BigNumberish,
      gas_: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    submitTaskBulkWithFee(
      version_: BigNumberish,
      owner_: string,
      model_: BytesLike,
      fee_: BigNumberish,
      input_: BytesLike,
      count_: BigNumberish,
      gas_: BigNumberish,
      feeAmount_: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    token(overrides?: CallOverrides): Promise<[string]>;
  };

  engine(overrides?: CallOverrides): Promise<string>;

  submitTaskBulk(
    version_: BigNumberish,
    owner_: string,
    model_: BytesLike,
    fee_: BigNumberish,
    input_: BytesLike,
    count_: BigNumberish,
    gas_: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  submitTaskBulkWithFee(
    version_: BigNumberish,
    owner_: string,
    model_: BytesLike,
    fee_: BigNumberish,
    input_: BytesLike,
    count_: BigNumberish,
    gas_: BigNumberish,
    feeAmount_: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  token(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    engine(overrides?: CallOverrides): Promise<string>;

    submitTaskBulk(
      version_: BigNumberish,
      owner_: string,
      model_: BytesLike,
      fee_: BigNumberish,
      input_: BytesLike,
      count_: BigNumberish,
      gas_: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    submitTaskBulkWithFee(
      version_: BigNumberish,
      owner_: string,
      model_: BytesLike,
      fee_: BigNumberish,
      input_: BytesLike,
      count_: BigNumberish,
      gas_: BigNumberish,
      feeAmount_: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    token(overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    engine(overrides?: CallOverrides): Promise<BigNumber>;

    submitTaskBulk(
      version_: BigNumberish,
      owner_: string,
      model_: BytesLike,
      fee_: BigNumberish,
      input_: BytesLike,
      count_: BigNumberish,
      gas_: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    submitTaskBulkWithFee(
      version_: BigNumberish,
      owner_: string,
      model_: BytesLike,
      fee_: BigNumberish,
      input_: BytesLike,
      count_: BigNumberish,
      gas_: BigNumberish,
      feeAmount_: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    token(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    engine(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    submitTaskBulk(
      version_: BigNumberish,
      owner_: string,
      model_: BytesLike,
      fee_: BigNumberish,
      input_: BytesLike,
      count_: BigNumberish,
      gas_: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    submitTaskBulkWithFee(
      version_: BigNumberish,
      owner_: string,
      model_: BytesLike,
      fee_: BigNumberish,
      input_: BytesLike,
      count_: BigNumberish,
      gas_: BigNumberish,
      feeAmount_: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    token(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}