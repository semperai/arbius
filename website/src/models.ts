import { ethers } from 'ethers'
import Config from '@/config.json';


// import AnythingV3Template from '@/templates/anythingv3.json';
// import ZeroscopeTemplate from '@/templates/zeroscopev2xl.json';
import Kandinsky2Template from '@/templates/kandinsky2.json';


export const models = [
  [Config.models.kandinsky2.id, 'Kandinsky2'],
//  [Config.models.anythingv3.id, 'AnythingV3'],
// [Config.models.zeroscopev2xl.id, 'Zeroscope V2 XL'],
];

export function getModelTemplate(modelid: string): any {
  switch (modelid) {
    //case Config.models.anythingv3.id:
    //  return AnythingV3Template;
    // case Config.models.zeroscopev2xl.id:
    //   return ZeroscopeTemplate;
    case Config.models.kandinsky2.id:
      return Kandinsky2Template;
  }

  return null;
}

export function getModelFee(modelid: string): any {
  for (const [k, v] of Object.entries(Config.models)) { 
    if (modelid === v.id) {
      return ethers.BigNumber.from(v.params.fee);
    }
  }

  return ethers.constants.Zero;
}
