// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SwapReceiver is Ownable {
    constructor() {}

    function recover(address _token, uint256 _amount) public {
        IERC20(_token).transfer(owner(), _amount);
    }

    function recoverETH(uint256 _amount) public {
        payable(owner()).transfer(_amount);
    }
}
