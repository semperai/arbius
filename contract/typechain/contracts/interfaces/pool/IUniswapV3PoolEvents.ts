/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  Signer,
  utils,
} from "ethers";
import type { EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../../common";

export interface IUniswapV3PoolEventsInterface extends utils.Interface {
  functions: {};

  events: {
    "Burn(address,int24,int24,uint128,uint256,uint256)": EventFragment;
    "Collect(address,address,int24,int24,uint128,uint128)": EventFragment;
    "CollectProtocol(address,address,uint128,uint128)": EventFragment;
    "Flash(address,address,uint256,uint256,uint256,uint256)": EventFragment;
    "IncreaseObservationCardinalityNext(uint16,uint16)": EventFragment;
    "Initialize(uint160,int24)": EventFragment;
    "Mint(address,address,int24,int24,uint128,uint256,uint256)": EventFragment;
    "SetFeeProtocol(uint8,uint8,uint8,uint8)": EventFragment;
    "Swap(address,address,int256,int256,uint160,uint128,int24)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Burn"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Collect"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "CollectProtocol"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Flash"): EventFragment;
  getEvent(
    nameOrSignatureOrTopic: "IncreaseObservationCardinalityNext"
  ): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Initialize"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Mint"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "SetFeeProtocol"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Swap"): EventFragment;
}

export interface BurnEventObject {
  owner: string;
  tickLower: number;
  tickUpper: number;
  amount: BigNumber;
  amount0: BigNumber;
  amount1: BigNumber;
}
export type BurnEvent = TypedEvent<
  [string, number, number, BigNumber, BigNumber, BigNumber],
  BurnEventObject
>;

export type BurnEventFilter = TypedEventFilter<BurnEvent>;

export interface CollectEventObject {
  owner: string;
  recipient: string;
  tickLower: number;
  tickUpper: number;
  amount0: BigNumber;
  amount1: BigNumber;
}
export type CollectEvent = TypedEvent<
  [string, string, number, number, BigNumber, BigNumber],
  CollectEventObject
>;

export type CollectEventFilter = TypedEventFilter<CollectEvent>;

export interface CollectProtocolEventObject {
  sender: string;
  recipient: string;
  amount0: BigNumber;
  amount1: BigNumber;
}
export type CollectProtocolEvent = TypedEvent<
  [string, string, BigNumber, BigNumber],
  CollectProtocolEventObject
>;

export type CollectProtocolEventFilter = TypedEventFilter<CollectProtocolEvent>;

export interface FlashEventObject {
  sender: string;
  recipient: string;
  amount0: BigNumber;
  amount1: BigNumber;
  paid0: BigNumber;
  paid1: BigNumber;
}
export type FlashEvent = TypedEvent<
  [string, string, BigNumber, BigNumber, BigNumber, BigNumber],
  FlashEventObject
>;

export type FlashEventFilter = TypedEventFilter<FlashEvent>;

export interface IncreaseObservationCardinalityNextEventObject {
  observationCardinalityNextOld: number;
  observationCardinalityNextNew: number;
}
export type IncreaseObservationCardinalityNextEvent = TypedEvent<
  [number, number],
  IncreaseObservationCardinalityNextEventObject
>;

export type IncreaseObservationCardinalityNextEventFilter =
  TypedEventFilter<IncreaseObservationCardinalityNextEvent>;

export interface InitializeEventObject {
  sqrtPriceX96: BigNumber;
  tick: number;
}
export type InitializeEvent = TypedEvent<
  [BigNumber, number],
  InitializeEventObject
>;

export type InitializeEventFilter = TypedEventFilter<InitializeEvent>;

export interface MintEventObject {
  sender: string;
  owner: string;
  tickLower: number;
  tickUpper: number;
  amount: BigNumber;
  amount0: BigNumber;
  amount1: BigNumber;
}
export type MintEvent = TypedEvent<
  [string, string, number, number, BigNumber, BigNumber, BigNumber],
  MintEventObject
>;

export type MintEventFilter = TypedEventFilter<MintEvent>;

export interface SetFeeProtocolEventObject {
  feeProtocol0Old: number;
  feeProtocol1Old: number;
  feeProtocol0New: number;
  feeProtocol1New: number;
}
export type SetFeeProtocolEvent = TypedEvent<
  [number, number, number, number],
  SetFeeProtocolEventObject
>;

export type SetFeeProtocolEventFilter = TypedEventFilter<SetFeeProtocolEvent>;

export interface SwapEventObject {
  sender: string;
  recipient: string;
  amount0: BigNumber;
  amount1: BigNumber;
  sqrtPriceX96: BigNumber;
  liquidity: BigNumber;
  tick: number;
}
export type SwapEvent = TypedEvent<
  [string, string, BigNumber, BigNumber, BigNumber, BigNumber, number],
  SwapEventObject
>;

export type SwapEventFilter = TypedEventFilter<SwapEvent>;

export interface IUniswapV3PoolEvents extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IUniswapV3PoolEventsInterface;

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

  functions: {};

  callStatic: {};

  filters: {
    "Burn(address,int24,int24,uint128,uint256,uint256)"(
      owner?: PromiseOrValue<string> | null,
      tickLower?: PromiseOrValue<BigNumberish> | null,
      tickUpper?: PromiseOrValue<BigNumberish> | null,
      amount?: null,
      amount0?: null,
      amount1?: null
    ): BurnEventFilter;
    Burn(
      owner?: PromiseOrValue<string> | null,
      tickLower?: PromiseOrValue<BigNumberish> | null,
      tickUpper?: PromiseOrValue<BigNumberish> | null,
      amount?: null,
      amount0?: null,
      amount1?: null
    ): BurnEventFilter;

    "Collect(address,address,int24,int24,uint128,uint128)"(
      owner?: PromiseOrValue<string> | null,
      recipient?: null,
      tickLower?: PromiseOrValue<BigNumberish> | null,
      tickUpper?: PromiseOrValue<BigNumberish> | null,
      amount0?: null,
      amount1?: null
    ): CollectEventFilter;
    Collect(
      owner?: PromiseOrValue<string> | null,
      recipient?: null,
      tickLower?: PromiseOrValue<BigNumberish> | null,
      tickUpper?: PromiseOrValue<BigNumberish> | null,
      amount0?: null,
      amount1?: null
    ): CollectEventFilter;

    "CollectProtocol(address,address,uint128,uint128)"(
      sender?: PromiseOrValue<string> | null,
      recipient?: PromiseOrValue<string> | null,
      amount0?: null,
      amount1?: null
    ): CollectProtocolEventFilter;
    CollectProtocol(
      sender?: PromiseOrValue<string> | null,
      recipient?: PromiseOrValue<string> | null,
      amount0?: null,
      amount1?: null
    ): CollectProtocolEventFilter;

    "Flash(address,address,uint256,uint256,uint256,uint256)"(
      sender?: PromiseOrValue<string> | null,
      recipient?: PromiseOrValue<string> | null,
      amount0?: null,
      amount1?: null,
      paid0?: null,
      paid1?: null
    ): FlashEventFilter;
    Flash(
      sender?: PromiseOrValue<string> | null,
      recipient?: PromiseOrValue<string> | null,
      amount0?: null,
      amount1?: null,
      paid0?: null,
      paid1?: null
    ): FlashEventFilter;

    "IncreaseObservationCardinalityNext(uint16,uint16)"(
      observationCardinalityNextOld?: null,
      observationCardinalityNextNew?: null
    ): IncreaseObservationCardinalityNextEventFilter;
    IncreaseObservationCardinalityNext(
      observationCardinalityNextOld?: null,
      observationCardinalityNextNew?: null
    ): IncreaseObservationCardinalityNextEventFilter;

    "Initialize(uint160,int24)"(
      sqrtPriceX96?: null,
      tick?: null
    ): InitializeEventFilter;
    Initialize(sqrtPriceX96?: null, tick?: null): InitializeEventFilter;

    "Mint(address,address,int24,int24,uint128,uint256,uint256)"(
      sender?: null,
      owner?: PromiseOrValue<string> | null,
      tickLower?: PromiseOrValue<BigNumberish> | null,
      tickUpper?: PromiseOrValue<BigNumberish> | null,
      amount?: null,
      amount0?: null,
      amount1?: null
    ): MintEventFilter;
    Mint(
      sender?: null,
      owner?: PromiseOrValue<string> | null,
      tickLower?: PromiseOrValue<BigNumberish> | null,
      tickUpper?: PromiseOrValue<BigNumberish> | null,
      amount?: null,
      amount0?: null,
      amount1?: null
    ): MintEventFilter;

    "SetFeeProtocol(uint8,uint8,uint8,uint8)"(
      feeProtocol0Old?: null,
      feeProtocol1Old?: null,
      feeProtocol0New?: null,
      feeProtocol1New?: null
    ): SetFeeProtocolEventFilter;
    SetFeeProtocol(
      feeProtocol0Old?: null,
      feeProtocol1Old?: null,
      feeProtocol0New?: null,
      feeProtocol1New?: null
    ): SetFeeProtocolEventFilter;

    "Swap(address,address,int256,int256,uint160,uint128,int24)"(
      sender?: PromiseOrValue<string> | null,
      recipient?: PromiseOrValue<string> | null,
      amount0?: null,
      amount1?: null,
      sqrtPriceX96?: null,
      liquidity?: null,
      tick?: null
    ): SwapEventFilter;
    Swap(
      sender?: PromiseOrValue<string> | null,
      recipient?: PromiseOrValue<string> | null,
      amount0?: null,
      amount1?: null,
      sqrtPriceX96?: null,
      liquidity?: null,
      tick?: null
    ): SwapEventFilter;
  };

  estimateGas: {};

  populateTransaction: {};
}
