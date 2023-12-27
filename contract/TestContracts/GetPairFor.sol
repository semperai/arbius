// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract GetPairFor {
    function pairFor(
        address tokenA,
        address tokenB,
        address factory,
        bytes32 initCodeHash
    ) public pure returns (address) {
        (address token0, address token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);

        address pair = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            hex"ff",
                            factory,
                            keccak256(abi.encodePacked(token0, token1)),
                            initCodeHash
                        )
                    )
                )
            )
        );

        return pair;
    }
}
