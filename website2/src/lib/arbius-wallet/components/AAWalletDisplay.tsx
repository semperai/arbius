import { useAAWallet } from '../hooks/useAAWallet';
import { useState } from 'react';
import { AAWalletModal } from './AAWalletModal';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';

interface AAWalletDisplayProps {
  arbiusLogoSrc?: string;
}

export function AAWalletDisplay({ arbiusLogoSrc }: AAWalletDisplayProps) {
  const { smartAccountAddress, isInitializing } = useAAWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (smartAccountAddress) {
      setIsModalOpen(true);
    }
  };

  if (isInitializing) {
    return (
      <div className="text-base text-gray-900 px-4 py-2 bg-white rounded-xl shadow-sm h-10 flex items-center font-[family-name:var(--font-family-fredoka)] font-medium">
        Initializing...
      </div>
    );
  }

  if (!smartAccountAddress) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="text-base text-gray-700 font-[family-name:var(--font-family-fredoka)] font-bold bg-white rounded-xl px-3 py-2 shadow-sm h-10 flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
      >
        {arbiusLogoSrc && (
          <Image src={arbiusLogoSrc} alt="Arbius" className="h-6 w-6 rounded-full" width={24} height={24} />
        )}
        <span className="hidden md:inline">
          0x{smartAccountAddress.slice(2, 4)}...{smartAccountAddress.slice(-4)}
        </span>
        <ChevronDown className="h-5 w-5 -ml-1" strokeWidth={2.5} />
      </button>

      <AAWalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        smartAccountAddress={smartAccountAddress}
      />
    </>
  );
}
