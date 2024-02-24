import { useState } from 'react';
import Image from 'next/image'
import MetamaskImg from '@/../public/metamask-logo.svg';
import MetamaskGrayscaleImg from '@/../public/metamask-grayscale-logo.svg';

import { useAccount } from 'wagmi';
import Config from '@/config.json';

export default function AddToWallet() {
  const { connector: activeConnector } = useAccount();
  const [isHovering, setIsHovered] = useState(false);
  const onMouseEnter = () => setIsHovered(true);
  const onMouseLeave = () => setIsHovered(false);

  function click() {
    if (! activeConnector) {
      return;
    }

    activeConnector!.watchAsset!({
      address: Config.v2_baseTokenAddress,
      decimals: 18,
      image: 'https://arbius.org/android-chrome-192x192.png',
      symbol: 'AIUS',
    });
  }

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="hover:cursor-pointer"
      onClick={click}
    >
      <Image
        src={isHovering ? MetamaskImg : MetamaskGrayscaleImg}
        alt="Add to wallet"
        width={16}
        />
    </div>
  );
}
