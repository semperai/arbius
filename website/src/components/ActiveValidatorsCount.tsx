import { useState } from 'react';
import { useWatchContractEvent } from 'wagmi';
import Config from '@/config.json';
import EngineArtifact from '@/artifacts/V2_EngineV1.sol/V2_EngineV1.json';

export default function ActiveValidatorsCount() {
  const [validators] = useState<Set<string>>(new Set<string>());
  const [validatorCount, setValidatorCount] = useState(0);
  useWatchContractEvent({
    address: Config.v2_engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    eventName: 'SolutionSubmitted',
    onLogs: (...args: any[]) => {
      const sender = args[0];
      if (sender) {
        validators.add(sender);
        setValidatorCount(validators.size);
      }
    },
  });

  return (
    <>
      <p>
        <strong>Active Validators</strong>
        <strong>: </strong>
        {validatorCount}
      </p>
      <p>
        <span className='text-xs'>
          Leave this page open to see precise number
        </span>
      </p>
    </>
  );
}
