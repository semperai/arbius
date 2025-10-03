import { WalletState } from '../types';
import { 
  WALLET_CONNECT, 
  WALLET_DISCONNECT, 
  WALLET_SWITCH_CHAIN,
  WALLET_SET_CONFIG, 
  WALLET_SET_STATE,
  TRANSACTION_ADD,
  TRANSACTION_UPDATE,
  WalletAction
} from './walletActions';

export const initialState: WalletState = {
  isConnected: false,
  address: null,
  chainId: null,
  transactions: []
};

export function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case WALLET_CONNECT:
      return {
        ...state,
        ...action.payload
      };
      
    case WALLET_DISCONNECT:
      return {
        ...state,
        isConnected: false,
        address: null,
        chainId: null
      };
      
    case WALLET_SWITCH_CHAIN:
      return {
        ...state,
        chainId: action.payload,
      };
      
    case WALLET_SET_CONFIG:
      return state;
      
    case WALLET_SET_STATE:
      return {
        ...action.payload,
      };
      
    case TRANSACTION_ADD:
      return {
        ...state,
        transactions: [...state.transactions, action.payload],
      };
      
    case TRANSACTION_UPDATE:
      return {
        ...state,
        transactions: state.transactions.map(tx => 
          tx.id === action.payload.id ? action.payload : tx
        ),
      };
      
    default:
      return state;
  }
}