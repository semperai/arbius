// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

// encode_varint from "@lazyledger/protobuf3-solidity-lib/contracts/ProtobufLib.sol";
// under Apache-2.0

/// @notice Encode varint.
/// @dev https://developers.google.com/protocol-buffers/docs/encoding#varints
/// @param n Number
/// @return Marshaled bytes
function encode_varint(uint64 n) pure returns (bytes memory) {
    // Count the number of groups of 7 bits
    // We need this pre-processing step since Solidity doesn't allow dynamic memory resizing
    uint64 tmp = n;
    uint64 num_bytes = 1;
    while (tmp > 0x7F) {
        tmp = tmp >> 7;
        ++num_bytes;
    }

    bytes memory buf = new bytes(num_bytes);

    tmp = n;
    for (uint64 i = 0; i < num_bytes; i++) {
        // Set the first bit in the byte for each group of 7 bits
        buf[i] = bytes1(0x80 | uint8(tmp & 0x7F));
        tmp = tmp >> 7;
    }
    // Unset the first bit of the last byte
    buf[num_bytes - 1] &= 0x7F;

    return buf;
}

/// @notice Generates IPFS cidv0 using sha2-256 multihash and merkledag protobuf
/// @param content file
/// @return CID
function getIPFSCID(bytes calldata content) pure returns (bytes memory) {
    require(content.length <= 65536, "Max content size is 65536 bytes");

    bytes memory content_length_varint = encode_varint(uint64(content.length));
    bytes memory meat = bytes.concat(
        // These are concat together:
        // * ProtobufLib.encode_key(1, uint64(ProtobufLib.WireType.Varint))
        // * ProtobufLib.encode_varint(uint64(IPFSDataType.File)),
        // * ProtobufLib.encode_key(2, uint64(ProtobufLib.WireType.LengthDelimited)),
        hex"080212",
        content_length_varint,
        content,
        hex"18", // ProtobufLib.encode_key(3, uint64(ProtobufLib.WireType.Varint)),
        content_length_varint
    );

    return
        bytes.concat(
            hex"1220", // sha256_32b
            sha256(
                bytes.concat(
                    hex"0a", // ProtobufLib.encode_key(1, uint64(ProtobufLib.WireType.LengthDelimited));
                    encode_varint(uint64(meat.length)),
                    meat
                )
            )
        );
}

/// @notice Generates IPFS cidv0 using sha2-256 multihash and merkledag protobuf
/// @param content file
/// @return CID
function getIPFSCIDMemory(bytes memory content) pure returns (bytes memory) {
    require(content.length <= 65536, "Max content size is 65536 bytes");

    bytes memory content_length_varint = encode_varint(uint64(content.length));
    bytes memory meat = bytes.concat(
        // These are concat together:
        // * ProtobufLib.encode_key(1, uint64(ProtobufLib.WireType.Varint))
        // * ProtobufLib.encode_varint(uint64(IPFSDataType.File)),
        // * ProtobufLib.encode_key(2, uint64(ProtobufLib.WireType.LengthDelimited)),
        hex"080212",
        content_length_varint,
        content,
        hex"18", // ProtobufLib.encode_key(3, uint64(ProtobufLib.WireType.Varint)),
        content_length_varint
    );

    return
        bytes.concat(
            hex"1220", // sha256_32b
            sha256(
                bytes.concat(
                    hex"0a", // ProtobufLib.encode_key(1, uint64(ProtobufLib.WireType.LengthDelimited));
                    encode_varint(uint64(meat.length)),
                    meat
                )
            )
        );
}
