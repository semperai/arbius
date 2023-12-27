import { MiningConfig } from './types';
import Replicate from "replicate";

let replicate: Replicate;

export function initializeML(c: MiningConfig) {
  replicate = new Replicate({
    auth: c.ml.replicate.api_token,
  });
}

export { replicate };
