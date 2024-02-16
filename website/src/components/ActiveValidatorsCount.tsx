import { useState } from 'react';
import {
  useContractEvent,
} from 'wagmi';
import Config from '@/config.json';
import EngineArtifact from '@/artifacts/EngineV1.sol/EngineV1.json';

import { ethers } from 'ethers'

export default function ActiveValidatorsCount() {
  const [validators] = useState<Set<string>>(new Set<string>());
  const [validatorCount, setValidatorCount] = useState(0);
  useContractEvent({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    eventName: 'TaskSubmitted',
    listener: (...args: any[]) => {
      const sender = args[3];
      if (sender) {
        validators.add(sender);
        setValidatorCount(validators.size);
      }
    },
  });

  return (
    <>
      <p>
        <strong>Active Validators</strong><strong>: </strong>
        {validatorCount}
      </p>
      <p>
        <span className='text-xs'>Leave this page open to see precise number</span>
      </p>
    </>
  );
}
