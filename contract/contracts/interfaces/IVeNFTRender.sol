pragma solidity ^0.8.13;

interface IVeNFTRender {
    function _tokenURI(uint _tokenId, uint _balanceOf, uint _locked_end, uint _value) external pure returns (string memory output);
}
