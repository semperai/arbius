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
import { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";

export interface VoterInterface extends utils.Interface {
  functions: {
    "createGauge(bytes32)": FunctionFragment;
    "epochVoteEnd()": FunctionFragment;
    "getGaugeMultiplier(bytes32)": FunctionFragment;
    "isAlive(bytes32)": FunctionFragment;
    "isGauge(bytes32)": FunctionFragment;
    "isWhitelisted(bytes32)": FunctionFragment;
    "killGauge(bytes32)": FunctionFragment;
    "lastVoted(uint256)": FunctionFragment;
    "length()": FunctionFragment;
    "modelVote(uint256,uint256)": FunctionFragment;
    "models(uint256)": FunctionFragment;
    "owner()": FunctionFragment;
    "poke(uint256)": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "reset(uint256)": FunctionFragment;
    "reviveGauge(bytes32)": FunctionFragment;
    "totalWeight()": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
    "usedWeights(uint256)": FunctionFragment;
    "vote(uint256,bytes32[],uint256[])": FunctionFragment;
    "votes(uint256,bytes32)": FunctionFragment;
    "votingEscrow()": FunctionFragment;
    "weights(bytes32)": FunctionFragment;
    "whitelist(bytes32)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "createGauge",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "epochVoteEnd",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getGaugeMultiplier",
    values: [BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "isAlive", values: [BytesLike]): string;
  encodeFunctionData(functionFragment: "isGauge", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "isWhitelisted",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "killGauge",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "lastVoted",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "length", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "modelVote",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "models",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(functionFragment: "poke", values: [BigNumberish]): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "reset", values: [BigNumberish]): string;
  encodeFunctionData(
    functionFragment: "reviveGauge",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "totalWeight",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "usedWeights",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "vote",
    values: [BigNumberish, BytesLike[], BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "votes",
    values: [BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "votingEscrow",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "weights", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "whitelist",
    values: [BytesLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "createGauge",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "epochVoteEnd",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getGaugeMultiplier",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "isAlive", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "isGauge", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "isWhitelisted",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "killGauge", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "lastVoted", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "length", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "modelVote", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "models", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "poke", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "reset", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "reviveGauge",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "totalWeight",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "usedWeights",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "vote", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "votes", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "votingEscrow",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "weights", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "whitelist", data: BytesLike): Result;

  events: {
    "Abstained(uint256,uint256)": EventFragment;
    "GaugeCreated(address,bytes32)": EventFragment;
    "GaugeKilled(bytes32)": EventFragment;
    "GaugeRevived(bytes32)": EventFragment;
    "OwnershipTransferred(address,address)": EventFragment;
    "Voted(address,uint256,bytes32,uint256)": EventFragment;
    "Whitelisted(address,bytes32)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Abstained"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "GaugeCreated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "GaugeKilled"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "GaugeRevived"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Voted"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Whitelisted"): EventFragment;
}

export type AbstainedEvent = TypedEvent<
  [BigNumber, BigNumber],
  { tokenId: BigNumber; weight: BigNumber }
>;

export type AbstainedEventFilter = TypedEventFilter<AbstainedEvent>;

export type GaugeCreatedEvent = TypedEvent<
  [string, string],
  { creator: string; model: string }
>;

export type GaugeCreatedEventFilter = TypedEventFilter<GaugeCreatedEvent>;

export type GaugeKilledEvent = TypedEvent<[string], { model: string }>;

export type GaugeKilledEventFilter = TypedEventFilter<GaugeKilledEvent>;

export type GaugeRevivedEvent = TypedEvent<[string], { model: string }>;

export type GaugeRevivedEventFilter = TypedEventFilter<GaugeRevivedEvent>;

export type OwnershipTransferredEvent = TypedEvent<
  [string, string],
  { previousOwner: string; newOwner: string }
>;

export type OwnershipTransferredEventFilter =
  TypedEventFilter<OwnershipTransferredEvent>;

export type VotedEvent = TypedEvent<
  [string, BigNumber, string, BigNumber],
  { voter: string; tokenId: BigNumber; model: string; weight: BigNumber }
>;

export type VotedEventFilter = TypedEventFilter<VotedEvent>;

export type WhitelistedEvent = TypedEvent<
  [string, string],
  { whitelister: string; model: string }
>;

export type WhitelistedEventFilter = TypedEventFilter<WhitelistedEvent>;

export interface Voter extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: VoterInterface;

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
    createGauge(
      _model: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    epochVoteEnd(overrides?: CallOverrides): Promise<[BigNumber]>;

    getGaugeMultiplier(
      _model: BytesLike,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    isAlive(arg0: BytesLike, overrides?: CallOverrides): Promise<[boolean]>;

    isGauge(arg0: BytesLike, overrides?: CallOverrides): Promise<[boolean]>;

    isWhitelisted(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    killGauge(
      _model: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    lastVoted(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    length(overrides?: CallOverrides): Promise<[BigNumber]>;

    modelVote(
      arg0: BigNumberish,
      arg1: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string]>;

    models(arg0: BigNumberish, overrides?: CallOverrides): Promise<[string]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    poke(
      _tokenId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    reset(
      _tokenId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    reviveGauge(
      _model: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    totalWeight(overrides?: CallOverrides): Promise<[BigNumber]>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    usedWeights(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    vote(
      tokenId: BigNumberish,
      _modelVote: BytesLike[],
      _weights: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    votes(
      arg0: BigNumberish,
      arg1: BytesLike,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    votingEscrow(overrides?: CallOverrides): Promise<[string]>;

    weights(arg0: BytesLike, overrides?: CallOverrides): Promise<[BigNumber]>;

    whitelist(
      _model: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  createGauge(
    _model: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  epochVoteEnd(overrides?: CallOverrides): Promise<BigNumber>;

  getGaugeMultiplier(
    _model: BytesLike,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  isAlive(arg0: BytesLike, overrides?: CallOverrides): Promise<boolean>;

  isGauge(arg0: BytesLike, overrides?: CallOverrides): Promise<boolean>;

  isWhitelisted(arg0: BytesLike, overrides?: CallOverrides): Promise<boolean>;

  killGauge(
    _model: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  lastVoted(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

  length(overrides?: CallOverrides): Promise<BigNumber>;

  modelVote(
    arg0: BigNumberish,
    arg1: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string>;

  models(arg0: BigNumberish, overrides?: CallOverrides): Promise<string>;

  owner(overrides?: CallOverrides): Promise<string>;

  poke(
    _tokenId: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  renounceOwnership(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  reset(
    _tokenId: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  reviveGauge(
    _model: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  totalWeight(overrides?: CallOverrides): Promise<BigNumber>;

  transferOwnership(
    newOwner: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  usedWeights(
    arg0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  vote(
    tokenId: BigNumberish,
    _modelVote: BytesLike[],
    _weights: BigNumberish[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  votes(
    arg0: BigNumberish,
    arg1: BytesLike,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  votingEscrow(overrides?: CallOverrides): Promise<string>;

  weights(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

  whitelist(
    _model: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    createGauge(_model: BytesLike, overrides?: CallOverrides): Promise<void>;

    epochVoteEnd(overrides?: CallOverrides): Promise<BigNumber>;

    getGaugeMultiplier(
      _model: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    isAlive(arg0: BytesLike, overrides?: CallOverrides): Promise<boolean>;

    isGauge(arg0: BytesLike, overrides?: CallOverrides): Promise<boolean>;

    isWhitelisted(arg0: BytesLike, overrides?: CallOverrides): Promise<boolean>;

    killGauge(_model: BytesLike, overrides?: CallOverrides): Promise<void>;

    lastVoted(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    length(overrides?: CallOverrides): Promise<BigNumber>;

    modelVote(
      arg0: BigNumberish,
      arg1: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    models(arg0: BigNumberish, overrides?: CallOverrides): Promise<string>;

    owner(overrides?: CallOverrides): Promise<string>;

    poke(_tokenId: BigNumberish, overrides?: CallOverrides): Promise<void>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    reset(_tokenId: BigNumberish, overrides?: CallOverrides): Promise<void>;

    reviveGauge(_model: BytesLike, overrides?: CallOverrides): Promise<void>;

    totalWeight(overrides?: CallOverrides): Promise<BigNumber>;

    transferOwnership(
      newOwner: string,
      overrides?: CallOverrides
    ): Promise<void>;

    usedWeights(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    vote(
      tokenId: BigNumberish,
      _modelVote: BytesLike[],
      _weights: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<void>;

    votes(
      arg0: BigNumberish,
      arg1: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    votingEscrow(overrides?: CallOverrides): Promise<string>;

    weights(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    whitelist(_model: BytesLike, overrides?: CallOverrides): Promise<void>;
  };

  filters: {
    "Abstained(uint256,uint256)"(
      tokenId?: null,
      weight?: null
    ): AbstainedEventFilter;
    Abstained(tokenId?: null, weight?: null): AbstainedEventFilter;

    "GaugeCreated(address,bytes32)"(
      creator?: null,
      model?: BytesLike | null
    ): GaugeCreatedEventFilter;
    GaugeCreated(
      creator?: null,
      model?: BytesLike | null
    ): GaugeCreatedEventFilter;

    "GaugeKilled(bytes32)"(model?: BytesLike | null): GaugeKilledEventFilter;
    GaugeKilled(model?: BytesLike | null): GaugeKilledEventFilter;

    "GaugeRevived(bytes32)"(model?: BytesLike | null): GaugeRevivedEventFilter;
    GaugeRevived(model?: BytesLike | null): GaugeRevivedEventFilter;

    "OwnershipTransferred(address,address)"(
      previousOwner?: string | null,
      newOwner?: string | null
    ): OwnershipTransferredEventFilter;
    OwnershipTransferred(
      previousOwner?: string | null,
      newOwner?: string | null
    ): OwnershipTransferredEventFilter;

    "Voted(address,uint256,bytes32,uint256)"(
      voter?: string | null,
      tokenId?: null,
      model?: null,
      weight?: null
    ): VotedEventFilter;
    Voted(
      voter?: string | null,
      tokenId?: null,
      model?: null,
      weight?: null
    ): VotedEventFilter;

    "Whitelisted(address,bytes32)"(
      whitelister?: string | null,
      model?: BytesLike | null
    ): WhitelistedEventFilter;
    Whitelisted(
      whitelister?: string | null,
      model?: BytesLike | null
    ): WhitelistedEventFilter;
  };

  estimateGas: {
    createGauge(
      _model: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    epochVoteEnd(overrides?: CallOverrides): Promise<BigNumber>;

    getGaugeMultiplier(
      _model: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    isAlive(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    isGauge(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    isWhitelisted(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    killGauge(
      _model: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    lastVoted(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    length(overrides?: CallOverrides): Promise<BigNumber>;

    modelVote(
      arg0: BigNumberish,
      arg1: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    models(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    poke(
      _tokenId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    reset(
      _tokenId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    reviveGauge(
      _model: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    totalWeight(overrides?: CallOverrides): Promise<BigNumber>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    usedWeights(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    vote(
      tokenId: BigNumberish,
      _modelVote: BytesLike[],
      _weights: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    votes(
      arg0: BigNumberish,
      arg1: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    votingEscrow(overrides?: CallOverrides): Promise<BigNumber>;

    weights(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    whitelist(
      _model: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    createGauge(
      _model: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    epochVoteEnd(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getGaugeMultiplier(
      _model: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    isAlive(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    isGauge(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    isWhitelisted(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    killGauge(
      _model: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    lastVoted(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    length(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    modelVote(
      arg0: BigNumberish,
      arg1: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    models(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    poke(
      _tokenId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    reset(
      _tokenId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    reviveGauge(
      _model: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    totalWeight(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    usedWeights(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    vote(
      tokenId: BigNumberish,
      _modelVote: BytesLike[],
      _weights: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    votes(
      arg0: BigNumberish,
      arg1: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    votingEscrow(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    weights(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    whitelist(
      _model: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}