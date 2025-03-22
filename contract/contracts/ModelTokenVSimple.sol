// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {
    ERC20Permit
} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {
    ERC20Votes
} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IArbius} from "./../interfaces/IArbius.sol";

contract ModelTokenV1 is ERC20, ERC20Permit, ERC20Votes, Ownable {
    // where the collected aius goes
    address public treasury;

    // address of the arbius contract
    IArbius public arbius;

    event Withdraw(address indexed caller, address indexed token);

    /// @notice Constructor
    /// @param _name the name of the token
    /// @param _symbol the symbol of the token
    /// @param _initialSupply the initial supply of the token
    /// @param _treasury the treasury address
    /// @param _arbius the arbius contract address
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        address _treasury,
        address _arbius,
    ) ERC20(_name, _symbol) ERC20Permit(_name) {
        treasury = _treasury;
        arbius = IArbius(_arbius);

        _mint(msg.sender, _initialSupply);
    }

    /// @notice Sets the treasury address
    /// @param _treasury the new treasury address
    function setTreasury(address _treasury) public onlyOwner {
        treasury = _treasury;
    }

    /// @notice Withdraws all tokens from the contract to the treasury
    /// @param token the token to withdraw
    function withdraw(address token) public {
        IERC20(token).transfer(treasury, IERC20(token).balanceOf(address(this)));
        emit Withdraw(msg.sender, token);
    }

    /// @notice Updates the base fee for a model
    /// @dev We don't need emit as arbius does for us
    /// @param _model the model to update
    /// @param _fee the new fee
    function updateModelFee(bytes32 _model, uint256 _fee) public onlyOwner {
        arbius.setModelFee(_model, _fee);
    }

    /// @notice Updates the models addr, this will make this contract unable to update the model or receive fees from it
    /// @dev We don't need emit as arbius does for us
    /// @param _model the model to update
    /// @param _addr the new address
    function updateModelAddr(bytes32 _model, address _addr) public onlyOwner {
        arbius.setModelAddr(_model, _addr);
    }

    // Overrides

    function _afterTokenTransfer(
        address from_,
        address to_,
        uint256 amount_
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from_, to_, amount_);
    }

    function _mint(
        address to_,
        uint256 amount_
    ) internal override(ERC20, ERC20Votes) {
        super._mint(to_, amount_);
    }

    function _burn(
        address account_,
        uint256 amount_
    ) internal override(ERC20, ERC20Votes) {
        super._burn(account_, amount_);
    }

    function transferOwnership(address to_) public override(Ownable) onlyOwner {
        super.transferOwnership(to_);
    }
}
