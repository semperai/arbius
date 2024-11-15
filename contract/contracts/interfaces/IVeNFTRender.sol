// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IVeNFTRender {
    function _tokenURI(
        uint256 _tokenId,
        uint256 _balanceOf,
        uint256 _veStakingBal,
        uint256 _locked_end,
        uint256 _value
    ) external pure returns (string memory output);
}
