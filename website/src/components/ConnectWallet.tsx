import { useState, useEffect } from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';

const buttonClassName =
  'inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50';

interface Props {
  update: (a: boolean) => void;
}

export default function ConnectWallet({ update }: Props) {
  const { isConnected } = useAccount();
  const { open: openWeb3Modal } = useWeb3Modal();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    update(isConnected);
  }, [isConnected, update]);

  async function clickConnect() {
    setLoading(true);
    try {
      await openWeb3Modal();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={isConnected ? 'hidden' : ''}>
      <button
        type='button'
        onClick={clickConnect}
        className={buttonClassName}
        disabled={loading}
      >
        {loading ? 'Connecting...' : 'Connect'}
      </button>
    </div>
  );
}
