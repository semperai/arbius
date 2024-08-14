// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "contracts/libraries/Base64.sol";
import "contracts/libraries/DateTimeLibrary.sol";

/*

/// @title VeNFTRender
/// @notice Renders the veAIUS NFT tokenURI
contract VeNFTRender {
    function _tokenURI(
        uint256 _tokenId,
        uint256 _balanceOf,
        uint256 _veStakingBal,
        uint256 _locked_end,
        uint256 _value
    ) external pure returns (string memory output) {
        // get datetime from timestamp
        (
            uint256 year,
            uint256 month,
            uint256 day,
            uint256 hour,
            uint256 minute,
            uint256 second
        ) = BokkyPooBahsDateTimeLibrary.timestampToDateTime(_locked_end);

        // convert datetime to string and append UTC
        string memory locked_end = string(
            abi.encodePacked(
                toString(year),
                "-",
                toString(month),
                "-",
                toString(day),
                " ",
                toString(hour),
                ":",
                toString(minute),
                ":",
                toString(second),
                " UTC"
            )
        );

        bytes memory image = abi.encodePacked(
            "data:image/svg+xml;base64,",
            Base64.encode(
                bytes(
                    abi.encodePacked(
                        '<?xml version="1.0" encoding="UTF-8"?>',
                        '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350"><style>.logo { fill: white; font-family: \'Courier New\', monospace; font-size: 6px; white-space: pre; } .base { fill: white; font-family: \'Courier New\', monospace; font-size: 8px; background: white }</style><rect width="100%" height="100%" fill="black" /><text x="10" y="20" class="logo" xml:space="preserve">',
                        "                      $$$$$$\\  $$$$$$\\ $$\\   $$\\  $$$$$$\\  ",
                        '</text><text x="10" y="30" class="logo" xml:space="preserve">',
                        "                     $$  __$$\\ \\_$$  _|$$ |  $$ |$$  __$$\\ ",
                        '</text><text x="10" y="40" class="logo" xml:space="preserve">',
                        "$$\\    $$\\  $$$$$$\\  $$ /  $$ |  $$ |  $$ |  $$ |$$ /  \\__|",
                        '</text><text x="10" y="50" class="logo" xml:space="preserve">',
                        "\\$$\\  $$  |$$  __$$\\ $$$$$$$$ |  $$ |  $$ |  $$ |\\$$$$$$\\  ",
                        '</text><text x="10" y="60" class="logo" xml:space="preserve">',
                        " \\$$\\$$  / $$$$$$$$ |$$  __$$ |  $$ |  $$ |  $$ | \\____$$\\ ",
                        '</text><text x="10" y="70" class="logo" xml:space="preserve">',
                        "  \\$$$  /  $$   ____|$$ |  $$ |  $$ |  $$ |  $$ |$$\\   $$ |",
                        '</text><text x="10" y="80" class="logo" xml:space="preserve">',
                        "   \\$  /   \\$$$$$$$\\ $$ |  $$ |$$$$$$\\ \\$$$$$$  |\\$$$$$$  |",
                        '</text><text x="10" y="90" class="logo" xml:space="preserve">',
                        "    \\_/     \\_______|\\__|  \\__|\\______| \\______/  \\______/ ",
                        '</text><text x="20" y="130" class="base">',
                        "Token ID: ",
                        toString(_tokenId),
                        '</text><text x="20" y="150" class="base">',
                        "Locked $AIUS: ",
                        convertWeiToEtherString(_value),
                        '</text><text x="20" y="170" class="base">',
                        "Lock ends at: ",
                        locked_end,
                        '</text><text x="20" y="190" class="base">',
                        "Voting weight in veAIUS: ",
                        convertWeiToEtherString(_balanceOf),
                        '</text><text x="20" y="210" class="base">',
                        "veStaking balance: ",
                        convertWeiToEtherString(_veStakingBal),
                        "</text>",
                        "</svg>"
                    )
                )
            )
        );

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"veAIUS #',
                                toString(_tokenId),
                                '", "image":"',
                                image,
                                unicode'", "description": "This NFT represents locked $AIUS. It receives token emissions and can be used for governance."}'
                            )
                        )
                    )
                )
            );
    }

    function convertWeiToEtherString(
        uint256 value
    ) internal pure returns (string memory) {
        uint256 whole = value / 1e18;
        uint256 fraction = (value % 1e18) / 1e14; // Considering 4 decimal places

        return
            string(abi.encodePacked(toString(whole), ".", toString(fraction)));
    }

    function toString(uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT license
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
*/
