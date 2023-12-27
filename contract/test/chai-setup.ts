import chaiModule from "chai";
import { chaiEthers } from "chai-ethers";
import chaiAsPromised from "chai-as-promised";
chaiModule.use(chaiEthers);
chaiModule.use(chaiAsPromised);
export = chaiModule;
