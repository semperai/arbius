import { useState } from 'react';
import Image from 'next/image';
import MetamaskImg from '@/../public/metamask-logo.svg';
import MetamaskGrayscaleImg from '@/../public/metamask-grayscale-logo.svg';

import { useAccount, useWalletClient } from 'wagmi';
import Config from '@/config.json';

export default function AddToWallet() {
  const { connector: activeConnector } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isHovering, setIsHovered] = useState(false);
  const onMouseEnter = () => setIsHovered(true);
  const onMouseLeave = () => setIsHovered(false);

  // function click() {
  //   if (!activeConnector) {
  //     return;
  //   }

  //   activeConnector!.watchAsset!({
  //     address: Config.v2_baseTokenAddress,
  //     decimals: 18,
  //     image: 'https://arbius.org/android-chrome-192x192.png',
  //     symbol: 'AIUS',
  //   });
  // }
  async function click() {
    if (!walletClient) return;

    try {
      await walletClient.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: Config.v2_baseTokenAddress,
            decimals: 18,
            image: 'https://arbius.org/android-chrome-192x192.png',
            symbol: 'AIUS',
          },
        },
      });
    } catch (error) {
      console.error('Error adding token:', error);
    }
  }

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className='hover:cursor-pointer'
      onClick={click}
    >
      <Image
        src={isHovering ? MetamaskImg : MetamaskGrayscaleImg}
        alt='Add to wallet'
        width={16}
      />
    </div>
  );
}
