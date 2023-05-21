// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.7.0 <0.9.0;

contract BuildingPermitContract {
    address public project;

    constructor (address _project) {
        project = _project;
    }
}