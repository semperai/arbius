import { ethers, BigNumber } from 'ethers';

class User {
  dml: BigNumber;

  constructor(dmlbal: BigNumber) {
    dml = dmlbal;
  }
}

const users: User[] = [];
for (let i=0; i<100; ++i) {
  users.push(new User(ethers.utils.parseEther('100')));
}
