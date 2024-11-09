import { useState, useEffect } from 'react';
import { useWeb3Modal } from '@web3modal/react';
import { useAccount } from 'wagmi';

const buttonClassName =
  'inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50';

interface Props {
  update: (a: boolean) => void;
}

export default function ConnectWallet({ update }: Props) {
  const { isConnected, isConnecting, isDisconnected } = useAccount();
  const { open: openWeb3Modal } = useWeb3Modal();

  const [walletConnected, setWalletConnected] = useState(false);
  const [loadingWeb3Modal, setLoadingWeb3Modal] = useState(false);

  useEffect(() => {
    setWalletConnected(isConnected);
    update(isConnected);
  }, [isConnected]);

  function clickConnect() {
    async function f() {
      setLoadingWeb3Modal(true);
      await openWeb3Modal();
      setLoadingWeb3Modal(false);
    }

    f();
  }

  return (
    <div className={walletConnected ? 'hidden' : ''}>
      <button
        type='button'
        onClick={clickConnect}
        className={buttonClassName}
        disabled={loadingWeb3Modal}
      >
        Connect
      </button>
    </div>
  );
}
