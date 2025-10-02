// import { Address } from 'viem'; // unused
import { AAWalletConfig, Transaction, WalletState } from '../types';

export const WALLET_CONNECT = 'WALLET_CONNECT';
export const WALLET_DISCONNECT = 'WALLET_DISCONNECT';
export const WALLET_SWITCH_CHAIN = 'WALLET_SWITCH_CHAIN';
export const WALLET_SET_CONFIG = 'WALLET_SET_CONFIG';
export const WALLET_SET_STATE = 'WALLET_SET_STATE';
export const TRANSACTION_ADD = 'TRANSACTION_ADD';
export const TRANSACTION_UPDATE = 'TRANSACTION_UPDATE';

interface WalletConnectAction {
  type: typeof WALLET_CONNECT;
  payload: WalletState;
}

interface WalletDisconnectAction {
  type: typeof WALLET_DISCONNECT;
}

interface WalletSwitchChainAction {
  type: typeof WALLET_SWITCH_CHAIN;
  payload: number;
}

interface WalletSetConfigAction {
  type: typeof WALLET_SET_CONFIG;
  payload: AAWalletConfig;
}

interface WalletSetStateAction {
  type: typeof WALLET_SET_STATE;
  payload: WalletState;
}

interface TransactionAddAction {
  type: typeof TRANSACTION_ADD;
  payload: Transaction;
}

interface TransactionUpdateAction {
  type: typeof TRANSACTION_UPDATE;
  payload: Transaction;
}

export type WalletAction =
  | WalletConnectAction
  | WalletDisconnectAction
  | WalletSwitchChainAction
  | WalletSetConfigAction
  | WalletSetStateAction
  | TransactionAddAction
  | TransactionUpdateAction;