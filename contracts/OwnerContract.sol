// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.7.0 <0.9.0;

contract OwnerContract {
    mapping (address => bool) public owners;
    mapping (address => bool) public authorizedUsers;

    enum UserType { projectManager, assessmentProvider, administrativeAuthority, other}
    constructor() {
        owners[msg.sender] = true; // Sets the contract deployer as an initial owner
    }

    modifier onlyOwner() {
        require(owners[msg.sender], "Only an authorized contract owner can perform this action");
        _;
    }

    function addOwner(address owner) public onlyOwner {
        owners[owner] = true;
    }

    function removeOwner(address owner) public onlyOwner {
        owners[owner] = false;
    }

    function authorizeUser(address user) public onlyOwner {
        authorizedUsers[user] = true;
    }

    function unauthorizeUser(address user) public onlyOwner {
        authorizedUsers[user] = false;
    }
}