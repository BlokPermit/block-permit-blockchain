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

    function addOwners(address[] calldata _owners) external onlyOwner {
        for (uint256 i = 0; i < _owners.length; i++) {
            owners[_owners[i]] = true;
        }
    }

    function removeOwners(address[] calldata _owners) external onlyOwner {
        for (uint256 i = 0; i < _owners.length; i++) {
            owners[_owners[i]] = false;
        }
    }

    function authorizeUsers(address[] calldata users) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            authorizedUsers[users[i]] = true;
        }
    }

    function unauthorizeUsers(address[] calldata users) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            authorizedUsers[users[i]] = false;
        }
    }
}