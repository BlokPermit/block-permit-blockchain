// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.7.0 <0.9.0;

import "./DocumentContract.sol";
import "./BuildingPermitContract.sol";
import "./Document.sol";

import "../node_modules/hardhat/console.sol";

contract Project {
    address public immutable projectManager;
    mapping (address => AssessmentProviderStruct) public assessmentProviders;
    uint256 public numOfAssessmentProviders;
    address public administrativeAuthority;
    DocumentContract[] public sentDPPs;
    uint256 public numOfAssessedDPPs;
    DocumentContract[] public sentDGDs;
    uint256 public numOfAssessedDGDs;
    BuildingPermitContract public buildingPermitContract;
    bool public isClosed;

    struct AssessmentProviderStruct {
        bool exists; // Turn to false if assessment provider is removed
        bool hasReceivedDPP;
        bool hasAssessedDPP;
        bool hasReceivedDGD;
        bool hasAssessedDGD;
    }

    // This struct is used as parameter in functions sendDPP() and sendDGD()
    struct DocumentContractStruct {
        address assessmentProvider;
        Document mainDocument;
        Document[] attachments;
        uint256 assessmentDueDate;
    }
    
    constructor () {
        projectManager = msg.sender;
    }

    modifier onlyProjectManager() {
        require(msg.sender == projectManager, "Only the project manager can call this function");
        _;
    }

    modifier DPPsInAssessment() {
        if (numOfAssessmentProviders != 0) {
            require(numOfAssessedDPPs < numOfAssessmentProviders, "This function cannot be called after all the DPPs have been assessed");
        }
        _;
    }

    modifier DGDsInAssessment() {
        require(numOfAssessedDPPs == numOfAssessmentProviders, "This function cannot be called before all DPPs have been assessed");
        require(numOfAssessedDGDs < numOfAssessmentProviders, "This function cannot be called after all the DGDs have been assessed");
        _;
    }

    modifier hasNotBeenClosed() {
        require(numOfAssessedDPPs == numOfAssessmentProviders && numOfAssessedDGDs == numOfAssessmentProviders, 
        "This function cannot be called before all DPPs and DGDs have been assessed");
        require(!isClosed, "This function cannot be called after the project has been closed");
        _;
    }

    event AssessmentProviderAdded(address indexed _address);

    function addAssessmentProviders(address[] calldata _assessmentProviders) public onlyProjectManager DPPsInAssessment {
        for (uint256 i = 0; i < _assessmentProviders.length; i++) {
            require(!assessmentProviders[_assessmentProviders[i]].exists, "You can't add assessment provider that already exsists on a project");
            assessmentProviders[_assessmentProviders[i]] = AssessmentProviderStruct(true, false, false, false, false);
            numOfAssessmentProviders++;
            emit AssessmentProviderAdded(_assessmentProviders[i]);
        }
    }

    event AssessmentProviderRemoved(address indexed _address);

    function removeAssessmentProviders(address[] calldata _assessmentProviders) public onlyProjectManager DPPsInAssessment {
        for (uint256 i = 0; i < _assessmentProviders.length; i++) {
            require(!assessmentProviders[_assessmentProviders[i]].hasAssessedDPP, "You can't remove assessmentProvider that has already received DPP");
            assessmentProviders[_assessmentProviders[i]].exists = false;
            numOfAssessmentProviders--;
            emit AssessmentProviderRemoved(_assessmentProviders[i]);
        }
    }

    event AdministrativeAuthoritySet(address _administrativeAuthority);

    function setAdministrativeAuthority(address _administrativeAuthority) public onlyProjectManager hasNotBeenClosed {
        require(administrativeAuthority == address(0), "Administrative authority has already been set");
        administrativeAuthority = _administrativeAuthority;
        emit AdministrativeAuthoritySet(_administrativeAuthority);
    }

    event AdministrativeAuthorityRemoved(address _administrativeAuthority);

    function removeAdministrativeAuthority() public onlyProjectManager hasNotBeenClosed {
        address tempAddress = administrativeAuthority;
        administrativeAuthority = address(0);
        emit AdministrativeAuthorityRemoved(tempAddress);
    }

    function changeAdministrativeAuthority(address _administrativeAuthority) public onlyProjectManager hasNotBeenClosed {
        removeAdministrativeAuthority();
        setAdministrativeAuthority(_administrativeAuthority);
    }

    event DPPsent(address _address);

    function sendDPPs(DocumentContractStruct[] calldata _sentDPPs) public onlyProjectManager DPPsInAssessment {
        for (uint256 i = 0; i < _sentDPPs.length; i++) {
            require(assessmentProviders[_sentDPPs[i].assessmentProvider].exists, "Addressed assessment provider has to exsist on a project");
            require(!assessmentProviders[_sentDPPs[i].assessmentProvider].hasReceivedDPP, "Addressed assessment provider has already received a DPP");
            DocumentContract DPPContract = new DocumentContract(
                projectManager,
                _sentDPPs[i].assessmentProvider,
                _sentDPPs[i].mainDocument,
                _sentDPPs[i].attachments,
                DocumentContract.MainDocumentType.DPP,
                _sentDPPs[i].assessmentDueDate,
                address(this)
            );
            sentDPPs.push(DPPContract);
            assessmentProviders[_sentDPPs[i].assessmentProvider].hasReceivedDPP = true;
            emit DPPsent(address(DPPContract));
        }
    }

    event allDPPsAssessed();

    function assessDPP(address assessmentProvider, bool requiresAssessment) external DPPsInAssessment { // Called from DocumentContract.provideAssessment()
        require(assessmentProviders[assessmentProvider].exists = true, "Assessment provider has to exsist on a project");
        require(!assessmentProviders[assessmentProvider].hasAssessedDPP, "This assessment provider has already assessed a DPP");
        assessmentProviders[assessmentProvider].hasAssessedDPP = true;
        numOfAssessedDPPs++;
        if (!requiresAssessment) {
            assessmentProviders[assessmentProvider].hasAssessedDGD = true;
            numOfAssessedDGDs++;
        }
        if (numOfAssessedDPPs == numOfAssessmentProviders) {
            emit allDPPsAssessed();
        }
    }

    event DGDsent(address _address);

    function sendDGDs(DocumentContractStruct[] calldata _sentDGDs) public onlyProjectManager DGDsInAssessment {
        for (uint256 i = 0; i < _sentDGDs.length; i++) {
            require(assessmentProviders[_sentDGDs[i].assessmentProvider].exists, "Addressed assessment provider has to exsist on a project");
            require(!assessmentProviders[_sentDGDs[i].assessmentProvider].hasReceivedDGD, "Addressed assessment provider has already received a DGD");
            DocumentContract DGDContract = new DocumentContract(
                projectManager,
                _sentDGDs[i].assessmentProvider,
                _sentDGDs[i].mainDocument,
                _sentDGDs[i].attachments,
                DocumentContract.MainDocumentType.DGD,
                _sentDGDs[i].assessmentDueDate,
                address(this)
            );
            sentDGDs.push(DGDContract);
            assessmentProviders[_sentDGDs[i].assessmentProvider].hasReceivedDGD = true;
            emit DGDsent(address(DGDContract));
        }
    }

    event allDGDsAssessed();

    function assessDGD(address assessmentProvider) external DGDsInAssessment { // Called from DocumentContract.provideAssessment()
        require(assessmentProviders[assessmentProvider].exists = true, "Assessment provider has to exsist on a project");
        require(!assessmentProviders[assessmentProvider].hasAssessedDGD, "This assessment provider has already assessed a DGD");
        assessmentProviders[assessmentProvider].hasAssessedDGD = true;
        numOfAssessedDGDs++;
        if (numOfAssessedDGDs == numOfAssessmentProviders) {
            emit allDGDsAssessed();
        }
    }

    event BuildingPermitContractCreated(address _address);

    function createBuildingPermitContract() internal hasNotBeenClosed {
        require(administrativeAuthority != address(0), "Administrative authority has to be added in order to call this function");
        BuildingPermitContract _buildingPermitContract = new BuildingPermitContract(address(this));
        buildingPermitContract = _buildingPermitContract;
        emit BuildingPermitContractCreated(address(_buildingPermitContract));
    }

    function getSentDPPsLength() public view returns (uint256) {
        return sentDPPs.length;
    }

    function getSentDGDsLength() public view returns (uint256){
        return sentDGDs.length;
    }

    function getSentDPPsAddresses() public view returns (address[] memory) {
        address[] memory addresses = new address[](sentDPPs.length);
        for (uint256 i = 0; i < sentDPPs.length; i++) {
            addresses[i] = address(sentDPPs[i]);
        }
        return addresses;
    }

    function getSentDGDsAddresses() public view returns (address[] memory) {
        address[] memory addresses = new address[](sentDGDs.length);
        for (uint256 i = 0; i < sentDGDs.length; i++) {
            addresses[i] = address(sentDGDs[i]);
        }
        return addresses;
    }
}