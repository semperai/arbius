// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract TestnetToken is
    ERC20Upgradeable,
    ERC20PermitUpgradeable,
    ERC20VotesUpgradeable,
    OwnableUpgradeable
{
    uint256[48] __gap; // upgradeable gap

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initialize contract
    /// @dev This is needed for upgradeable contracts
    function initialize() public initializer {
        __ERC20_init("TArbius", "TAIUS");
        __ERC20Permit_init("TArbius");
        __ERC20Votes_init();
        __Ownable_init();
    }

    /// @notice should increase token supply by amount, and should only be callable by the L2Gateway.
    /// @param account address to mint tokens to
    /// @param amount amount of tokens to mint
    function mint(address account, uint256 amount) external {
        _mint(account, amount);
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
