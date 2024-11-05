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
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IArbius} from "./../interfaces/IArbius.sol";

contract AmicaModelToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    // where the transfer taxes go
    address public treasury;

    // address of the arbius contract
    IArbius public arbius;

    // our pair token
    IERC20 public arbiusToken;

    // this can be a contract which e.g. airdrops to holders
    // or can be same as normal treasury address
    address public arbiusTreasury;

    // uniswap router
    IUniswapV2Router02 public router;

    // tax (between 0 and 1eth : 0% - 100%)
    uint256 public tax;

    // remove these addresses from tax
    mapping(address => bool) public whitelist;

    // disable tax during swap
    bool private lock;

    event TaxSet(uint256 tax);
    event TokenWithdrawn(address indexed addr, address indexed token, uint256 amount);
    event WhitelistUpdated(address indexed addr, bool whitelisted);

    modifier lockSwap {
        lock = true;
        _;
        lock = false;
    }


    /// @notice Constructor
    /// @param _name the name of the token
    /// @param _symbol the symbol of the token
    /// @param _initialSupply the initial supply of the token
    /// @param _treasury the treasury address
    /// @param _arbius the arbius contract address
    /// @param _arbiusToken the arbius token address
    /// @param _arbiusTreasury the arbius treasury address
    /// @param _router the uniswap router address
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        address _treasury,
        address _arbius,
        address _arbiusToken,
        address _arbiusTreasury,
        address _router
    ) ERC20(_name, _symbol) ERC20Permit(_name) {
        treasury = _treasury;
        arbius = IArbius(_arbius);
        arbiusToken = IERC20(_arbiusToken);
        arbiusTreasury = _arbiusTreasury;

        router = IUniswapV2Router02(_router);

        // add the owner to the whitelist
        whitelist[msg.sender] = true;
        whitelist[address(this)] = true;
        whitelist[treasury] = true;

        // mint the initial supply
        _mint(msg.sender, _initialSupply);

        // approve the router to spend the token
        _approve(address(this), address(router), type(uint256).max);
    }

    /// @notice Sets the tax
    /// @dev 0 is no tax, 1ether is 100% tax
    /// @param _tax the new tax
    function setTax(uint256 _tax) public onlyOwner {
        require(_tax <= 1 ether, "Tax must be less than 1 ether");
        tax = _tax;
        emit TaxSet(_tax);
    }

    /// @notice Withdraws tokens from the contract to the arbiusTreasury
    /// @param _token the token to withdraw
    function withdraw(address _token) public {
        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        token.transfer(arbiusTreasury, balance);
        emit TokenWithdrawn(msg.sender, _token, balance);
    }


    /// @notice Updates the whitelist
    /// @param _addr the address to update
    /// @param _whitelisted the new value
    function updateWhitelist(address _addr, bool _whitelisted) public onlyOwner {
        whitelist[_addr] = _whitelisted;
        emit WhitelistUpdated(_addr, _whitelisted);
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

    /// @notice Used to convert the tax to eth
    /// @param _amount the amount to convert
    function swapTokensForEth(uint256 _amount) internal lockSwap {
        // Generate the uniswap pair path of token -> WETH
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = router.WETH();

        // Make the swap
        router.swapExactTokensForETH(
            _amount,
            0, // Accept any amount of ETH
            path,
            treasury,
            block.timestamp
        );
    }

    // Overrides

    // this diverts some of the transfer if tax enabled
    function _transfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal virtual override {
        if (lock || tax == 0 || whitelist[_from] || whitelist[_to]) {
            super._transfer(_from, _to, _amount);
            return;
        }

        uint256 taxAmount = _amount * tax / 1 ether;
        uint256 transferAmount = _amount - taxAmount;

        super._transfer(_from, _to, transferAmount);

        if (taxAmount > 0) {
            super._transfer(_from, address(this), taxAmount);
            swapTokensForEth(taxAmount);
        }
    }

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
