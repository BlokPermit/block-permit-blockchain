// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.7.0 <0.9.0;

struct Document {
    string id; // This is equivalent to "Version ID" from Amazon S3
    address owner;
    bytes32 documentHash;
}
