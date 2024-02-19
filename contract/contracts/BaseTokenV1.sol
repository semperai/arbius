// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/IArbToken.sol";

contract BaseTokenV1 is
    ERC20Upgradeable,
    ERC20PermitUpgradeable,
    ERC20VotesUpgradeable,
    OwnableUpgradeable,
    IArbToken
{
    address public l2Gateway;
    address public override l1Address;
    uint256[48] __gap; // upgradeable gap

    /// @notice only the l2Gateway can call functions with this modifier
    modifier onlyL2Gateway() {
        require(msg.sender == l2Gateway, "NOT_GATEWAY");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initialize contract
    /// @dev This is needed for upgradeable contracts
    /// @param _l2Gateway address of the L2 gateway contract
    /// @param _l1TokenAddress address of the L1 token contract
    function initialize(
        address _l2Gateway,
        address _l1TokenAddress
    ) public initializer {
        __ERC20_init("Arbius", "AIUS");
        __ERC20Permit_init("Arbius");
        __ERC20Votes_init();
        __Ownable_init();

        l2Gateway = _l2Gateway;
        l1Address = _l1TokenAddress;
    }

    /// @notice should increase token supply by amount, and should only be callable by the L2Gateway.
    /// @param account address to mint tokens to
    /// @param amount amount of tokens to mint
    function bridgeMint(
        address account,
        uint256 amount
    ) external override onlyL2Gateway {
        _mint(account, amount);
    }

    /// @notice should decrease token supply by amount, and should only be callable by the L2Gateway.
    /// @param account address to burn tokens from
    /// @param amount amount of tokens to burn
    function bridgeBurn(
        address account,
        uint256 amount
    ) external override onlyL2Gateway {
        _burn(account, amount);
    }

    // Overrides

    function _afterTokenTransfer(
        address from_,
        address to_,
        uint256 amount_
    ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._afterTokenTransfer(from_, to_, amount_);
    }

    function _mint(
        address to_,
        uint256 amount_
    ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._mint(to_, amount_);
    }

    function _burn(
        address account_,
        uint256 amount_
    ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._burn(account_, amount_);
    }

    function transferOwnership(
        address to_
    ) public override(OwnableUpgradeable) onlyOwner {
        super.transferOwnership(to_);
    }
}
