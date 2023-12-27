// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GenericTestERC20 is ERC20 {
    constructor() ERC20("Test", "Test") {}

    function mint(uint256 amount) external {
        _mint(msg.sender, amount);
    }
}
