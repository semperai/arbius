import Web3 from 'web3';
import getGYSRBalance from './aggregatedWalletBalance';

export const connectWalletHandler = async () => {
  if (typeof window !== 'undefined') {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.enable();
        localStorage.setItem('walletConnected', 'true');
        getGYSRBalance();
        return true;
      } catch (error) {
        console.error('User denied account access');

        return false;
      }
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
      localStorage.setItem('walletConnected', 'true');

      return true;
    } else {
      localStorage.removeItem('walletConnected');
      return false;
    }
  } else {
    console.error('window is not defined');
    return false;
  }
};

const checkWalletConnection = async () => {
  if (typeof window !== 'undefined') {
    const isWalletConnected = localStorage.getItem('walletConnected');
    if (isWalletConnected) {
      const connected = await connectWalletHandler();
      if (!connected) {
        localStorage.removeItem('walletConnected');
      }
    }
  } else {
    console.error('window is not defined');
  }
};

// Call the checkWalletConnection function on page load, if window is defined
if (typeof window !== 'undefined') {
  window.addEventListener('load', checkWalletConnection);
}
