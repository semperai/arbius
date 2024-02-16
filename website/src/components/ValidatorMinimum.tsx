import { useState, useEffect } from 'react';
import {
  useContractRead,
} from 'wagmi';
import Config from '@/config.json';
import EngineArtifact from '@/artifacts/EngineV1.sol/EngineV1.json';
import BaseTokenArtifact from '@/artifacts/BaseTokenV1.sol/BaseTokenV1.json';
import { formatBalance } from '@/utils';

import { ethers } from 'ethers'

export default function ValidatorMinimum() {
  const [validatorMinimum, setValidatorMinimum] = useState(ethers.constants.Zero);

  const {
    data: validatorMinimumRaw,
  } = useContractRead({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    functionName: 'getValidatorMinimum',
    args: [],
  });

  useEffect(() => {
    if (validatorMinimumRaw) {
      setValidatorMinimum(validatorMinimumRaw as ethers.BigNumber);
    }
  }, [validatorMinimumRaw]);

  let validatorMinimumStr = '';
  if (validatorMinimum) {
    validatorMinimumStr = formatBalance(validatorMinimum);
  }

  return (
    <div>
      <p>
        <strong>Current Minumum Required Validator Stake: </strong>
        {validatorMinimumStr} AIUS
      </p>
    </div>
  );
}
