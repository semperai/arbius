import { BigNumber } from 'ethers';
import { base58 } from '@scure/base';
import Config from './config.json';

// import AnythingV3Template from "./templates/anythingv3.json"
// import ZeroscopeTemplate from "./templates/zeroscopev2xl.json"
import Kandinsky2Template from "./templates/kandinsky2.json"

import { expretry } from './utils';
import { pinFilesToIPFS } from './ipfs';
import {
  MiningConfig,
  Model,
  MiningFilter,
  FilterResult,
  InputHydrationResult,
} from './types';

// just convenience defaults
const default__filters: MiningFilter[] = [];

// each mineable model should implement their own version of this based on output
const default__getfiles = async (
  model: Model,
  taskid: string,
  input: any
): Promise<string[]> => {
  throw new Error(`getfiles unimplmented for task (${taskid}) model ${JSON.stringify(model)}`);
  return [];
};

// this usually can be left as default
// provided in case there is some need for custom ipfs handling logic
const default__getcid = async (
  c: MiningConfig,
  model: Model,
  taskid: string,
  input: any
) => {
  if (c.evilmode) {
    return '0x12206666666666666666666666666666666666666666666666666666666666666666';
  }
  const paths = await expretry(async () => await model.getfiles(model, taskid, input));
  if (! paths) {
    throw new Error('cannot get paths');
  }
  // TODO calculate cid and pin async
  const cid58 = await expretry(async () => await pinFilesToIPFS(c, taskid, paths));
  if (! cid58) {
    throw new Error('cannot pin files to retrieve cid');
  }
  const cid = '0x'+Buffer.from(base58.decode(cid58)).toString('hex');
  return cid;
};

/*
export const AnythingV3Model: Model = {
  id:       Config.models.anythingv3.id,
  mineable: Config.models.anythingv3.mineable,
  template: AnythingV3Template,
  filters:  default__filters,
  getfiles: default__getfiles,
  getcid:   default__getcid,
};
*/

/*
export const ZeroscopeModel: Model = {
  id:       Config.models.zeroscopev2xl.id,
  mineable: Config.models.zeroscopev2xl.mineable,
  template: ZeroscopeTemplate,
  filters:  default__filters,
  getfiles: default__getfiles,
  getcid:   default__getcid,
};
*/

export const Kandinsky2Model: Model = {
  id:       Config.models.kandinsky2.id,
  mineable: Config.models.kandinsky2.mineable,
  template: Kandinsky2Template,
  filters:  default__filters,
  getfiles: default__getfiles,
  getcid:   default__getcid,
};

export function getModelById(
  models: Model[],
  model: string,
): Model|null {
  for (let m of models) {
    if (model === m.id) {
      return m;
    }
  }

  return null;
}

export function checkModelFilter(
  models: Model[],
  params: {
    model: string;
    now: number;
    fee: BigNumber;
    blocktime: BigNumber;
    owner: string;
  },
): FilterResult {
  let modelEnabled = false;
  let modelTemplate = null;
  let filterPassed = false;

  const m = getModelById(models, params.model);
  if (m !== null) {
    modelEnabled = true;
    modelTemplate = m.template;

    for (let f of m.filters) {
      if (f.owner && params.owner !== f.owner) {
        continue;
      }

      if (! params.fee.gte(f.minfee)) {
        continue;
      }

      const t = params.now - params.blocktime.toNumber();
      if (f.mintime > 0 && t < f.mintime) {
        continue;
      }

      filterPassed = true;
      break;
    }
  }

  return {
    modelEnabled,
    filterPassed,
    modelTemplate,
  };
}

export function hydrateInput(
  preprocessedInput: any,
  template: any,
): InputHydrationResult {
  // this will be populated from preprocessedInput with the template
  let input: any = {};

  function e(errmsg: string) {
    return {
      input,
      err: true,
      errmsg,
    };
  }

  for (const row of template.input) {
    const col = preprocessedInput[row.variable];

    // check required fields are there
    if (row.required) {
      if (typeof col === 'undefined') {
        return e(`input missing required field (${row.variable})`);
      }
    }

    if (typeof col !== 'undefined') {
      // check type matches
      switch(row.type) {
        case 'string':
        case 'string_enum':
          if (typeof(col) !== 'string') {
            return e(`input wrong type (${row.variable})`);
          }
          break;
        case 'int':
        case 'int_enum':
          if (typeof(col) !== 'number' || col !== (col|0)) {
            return e(`input wrong type (${row.variable})`);
          }
          break;
        case 'decimal':
          if (typeof(col) !== 'number' || col !== (col|0)) {
            return e(`input wrong type (${row.variable})`);
          }
          break;
      }

      // check range for numbers
      if (row.type === 'int' || row.type === 'decimal') {
        if (col < row.min || row > col.max) {
          return e(`input out of bounds (${row.variable})`);
        }
      }

      // check inside enum
      if (row.type === 'string_enum' || row.type === 'int_enum') {
        if (! row.choices.includes(col)) {
          return e(`input not in enum (${row.variable})`);
        }
      }

      // ok, everything passed
      input[row.variable] = col;
    }

    if (typeof col === 'undefined') {
      input[row.variable] = row['default'];
    }
  }

  return {
    input,
    err: false,
    errmsg: '',
  };
}
