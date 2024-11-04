// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TestnetFaucet {
    IERC20 public token;

    constructor(address tokenAddress) {
        token = IERC20(tokenAddress);
    }

    // transfer 100 AIUS to msg.sender
    function faucet() external {
        require(token.transfer(msg.sender, 100 ether), "Transfer failed");
    }
}
