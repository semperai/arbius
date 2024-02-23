// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract OneToOneConvert {
    IERC20 public tokenA;
    IERC20 public tokenB;

    event Swap(address indexed sender, uint256 indexed amount);

    /// @param _tokenA The address of token A
    /// @param _tokenB The address of token B
    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    /// @notice Swap token A for token B
    /// @dev User must approve this contract to spend token A
    /// @param _amount The amount of token A to swap
    function swap(uint256 _amount) external {
        // burn token a
        tokenA.transferFrom(msg.sender, address(0x0), _amount);
        // send token b to user
        tokenB.transfer(msg.sender, _amount);

        emit Swap(msg.sender, _amount);
    }
}
