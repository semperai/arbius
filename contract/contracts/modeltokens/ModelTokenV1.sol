// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {IArbius} from "./../interfaces/IArbius.sol";
import {ModelTokenSwapReceiver} from "./ModelTokenSwapReceiver.sol";

contract ModelTokenV1 is ERC20, ERC20Permit, ERC20Votes, Ownable {
    // where the transfer taxes go
    address public treasury;

    // address of the arbius contract
    IArbius public arbius;

    // our pair token
    IERC20 public arbiusToken;

     // this can be a contract which e.g. airdrops to holders
    // or can be same as normal treasury address
    address public arbiusTreasury;

    // uniswap router for adding liquidity
    IUniswapV2Router02 public router;

    // allow public syncing for a model
    mapping(bytes32 => bool) public publicSyncingEnabled;

    // pricing token for syncing
    mapping(bytes32 => IERC20) public pricingToken;

    // target price for syncing
    mapping(bytes32 => uint256) public targetPrice;

    // taxes are disabled by default
    bool public taxEnabled = false;

    // used to receive swaps since uniswap doesnt allow "to" to be contract
    ModelTokenSwapReceiver public swapReceiver;

    // percent to give as reward for bots calling liquidate or withdrawArbius
    uint256 public rewardDivisor = 10000 ether;

    // 2% of transfer amount goes to taxes for liquidity and treasury
    // 1% to treasury, 1% to liquidity
    // this is 1/2 of the fee
    uint256 public taxDivisor = 50 ether;

    // 50% of taxes go to liquidity
    uint256 public liquidityDivisor = 2 ether;

    event TaxEnabled();
    event SwapReceiverSet(address indexed addr);
    event RewardDivisorSet(uint256 rewardDivisor);
    event TaxDivisorSet(uint256 taxDivisor);
    event LiquidityDivisorSet(uint256 liquidityDivisor);
    event Liquidation(address indexed caller);
    event ArbiusWithdrawn(address indexed caller);
    event PublicSyncingEnabled(bytes32 indexed model, bool enabled);
    event PricingTokenSet(bytes32 indexed model, address indexed addr);
    event TargetPriceSet(bytes32 indexed model, uint256 targetPrice);
    event Sync(bytes32 indexed model, uint256 price);


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

        _mint(msg.sender, _initialSupply);

        // for liquidity / uniswap
        _approve(address(this), address(router), type(uint256).max);
        arbiusToken.approve(address(router), type(uint256).max);
    }

    /// @notice Enables taxes on the contract
    /// @dev Taxes are disabled by default to allow for setup
    /// @dev Note: this can only be called once
    function enableTax() public onlyOwner {
        require(!taxEnabled, "ModelTokenV1: tax already enabled");
        taxEnabled = true;
        emit TaxEnabled();
    }

    /// @notice Allows the sync function to be called by anyone
    /// @param _model the model to enable public syncing for
    /// @param _enabled whether or not to enable public syncing
    function setPublicSyncingEnabled(bytes32 _model, bool _enabled) public onlyOwner {
        publicSyncingEnabled[_model] = _enabled;
        emit PublicSyncingEnabled(_model, _enabled);
    }

    /// @notice Sets the pricing token for syncing
    /// @param _model the model to set the pricing token for
    /// @param _addr the address of the pricing token
    function setPricingToken(bytes32 _model, address _addr) public onlyOwner {
        pricingToken[_model] = IERC20(_addr);
        emit PricingTokenSet(_model, _addr);
    }

    /// @notice Sets the target price for syncing
    /// @param _targetPrice the new target price
    function setTargetPrice(bytes32 _model, uint256 _targetPrice) public onlyOwner {
        targetPrice[_model] = _targetPrice;
        emit TargetPriceSet(_model, _targetPrice);
    }


    /// @notice Sets the address that receives swap tokens
    /// @dev This is used for the liquidation function
    /// @param _addr the address of the model token swap receiver
    function setSwapReceiver(address _addr) public onlyOwner {
        swapReceiver = ModelTokenSwapReceiver(_addr);
        emit SwapReceiverSet(_addr);
    }

    /// @notice Sets the reward divisor
    /// @param _rewardDivisor the new reward divisor
    function setRewardDivisor(uint256 _rewardDivisor) public onlyOwner {
        rewardDivisor = _rewardDivisor;
        emit RewardDivisorSet(_rewardDivisor);
    }

    /// @notice Sets the tax divisor
    /// @param _taxDivisor the new tax divisor
    function setTaxDivisor(uint256 _taxDivisor) public onlyOwner {
        taxDivisor = _taxDivisor;
        emit TaxDivisorSet(_taxDivisor);
    }

    /// @notice Sets the liquidity divisor
    /// @param _liquidityDivisor the new liquidity divisor
    function setLiquidityDivisor(uint256 _liquidityDivisor) public onlyOwner {
        liquidityDivisor = _liquidityDivisor;
        emit LiquidityDivisorSet(_liquidityDivisor);
    }

    /// @notice Zaps to liquidity and converts collected to treasury
    /// @dev a reward is given to the caller
    function liquidate() public {
        require(taxEnabled, "ModelTokenV1: tax not enabled");
        require(address(swapReceiver) != address(0), "ModelTokenV1: swap receiver not set");

        // temporarily disable taxes for liquidation
        taxEnabled = false;

        {
            // first a small reward is given to the caller
            // per $10,000 transfer at 1% tax this is $0.01 
            uint256 reward = balanceOf(address(this)) * 1 ether / rewardDivisor;

            if (reward > 0) {
                // send reward to msg.sender
                _transfer(address(this), msg.sender, reward);
            }
        }

        {
            // we convert half of the amount to aius for liquidity
            uint256 amount = balanceOf(address(this)) * 1 ether / liquidityDivisor / 2;

            if (amount > 0) {
                // path is just model -> arbius
                address[] memory path = new address[](2);
                path[0] = address(this);
                path[1] = address(arbiusToken);

                // perform the swap
                router.swapExactTokensForTokens(
                    amount,
                    0, // amountOutMin
                    path,
                    address(swapReceiver),
                    type(uint256).max // deadline
                );

                // move the tokens back to our contract
                swapReceiver.recover(address(arbiusToken), arbiusToken.balanceOf(address(swapReceiver)));

                // next we add liquidity
                router.addLiquidity(
                    address(this),
                    address(arbiusToken),
                    amount,
                    arbiusToken.balanceOf(address(this)),
                    0, // amountOutMin
                    0, // amountOutMin
                    address(0x0), // send liquidity to the void
                    type(uint256).max // deadline
                );
            }
        }

        // convert other half to eth for treasury
        {
            uint256 amount = balanceOf(address(this));

            if (amount > 0) {
                address[] memory path = new address[](3);
                path[0] = address(this);
                path[1] = address(arbiusToken);
                path[2] = router.WETH();

                router.swapExactTokensForETH(
                    amount,
                    0, // amountOutMin
                    path,
                    treasury,
                    type(uint256).max // deadline
                );
            }
        }


        // re-enable fees
        taxEnabled = true;
        emit Liquidation(msg.sender);
    }

    /// @notice Withdraws all arbius tokens from the contract to the arbiusTreasury
    /// @dev a reward is given to the caller
    function withdrawArbius() public {
        uint256 balance = arbiusToken.balanceOf(address(this));
        uint256 reward = balance * 1 ether / rewardDivisor;
        uint256 amount = balance - reward;
        if (reward > 0) {
            arbiusToken.transfer(msg.sender, reward);
        }
        arbiusToken.transfer(arbiusTreasury, amount);
        emit ArbiusWithdrawn(msg.sender);
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

    /// @notice Syncs the model token with the pricing token
    /// @dev We want to get price of arbius in usd by going from arbius -> weth -> usdc
    /// @param _model the model to sync
    function sync(bytes32 _model) public {
        require(publicSyncingEnabled[_model] || msg.sender == owner(), "ModelTokenV1: public syncing not enabled");
        require(address(pricingToken[_model]) != address(0), "ModelTokenV1: pricing token not set");

        address[] memory path = new address[](3);
        path[0] = address(pricingToken[_model]);
        path[1] = router.WETH();
        path[2] = address(arbiusToken);

        uint256[] memory out = router.getAmountsOut(1 ether, path);

        uint256 fee = out[2] * targetPrice[_model] / 1e18;

        arbius.setModelFee(_model, fee);

        emit Sync(_model, fee);
    }

    // Overrides

    // this diverts some of the transfer if tax enabled
    function _transfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal virtual override {
        if (
            ! taxEnabled ||
            _from == address(0) ||
            _from == address(this) ||
            _from == treasury ||
            _to   == address(0) ||
            _to   == address(this) ||
            _to   == treasury
        ) {
            super._transfer(_from, _to, _amount);
            return;
        }

        uint256 taxAmount  = _amount * 1 ether / taxDivisor;
        uint256 transferAmount = _amount - taxAmount;

        if (taxAmount > 0) {
            super._transfer(_from, address(this), taxAmount);
        }
        if (transferAmount > 0) {
            super._transfer(_from, _to, transferAmount);
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

    function transferOwnership(
        address to_
    ) public override(Ownable) onlyOwner {
        super.transferOwnership(to_);
    }
}
