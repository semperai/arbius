import Web3 from 'web3';

export const getTransactionReceiptData = async (hash) => {
  const web3 = new Web3(window.ethereum);
  const receipt = await web3.eth.getTransactionReceipt(hash);
  return receipt;
};
