// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.7.0 <0.9.0;

import "./DocumentContract.sol";
import "./BuildingPermitContract.sol";
import "./Document.sol";

import "../node_modules/hardhat/console.sol";

contract Project {
    address public immutable projectManager;
    mapping (address => AssessmentProviderStruct) public assessmentProviders;
    address[] public assessmentProvidersAddresses; 
    uint256 public numOfAssessmentProviders;
    address public administrativeAuthority;
    Document public DPP;
    DocumentContract[] public sentDPPs;
    uint256 public numOfAssessedDPPs;
    Document public DGD;
    DocumentContract[] public sentDGDs;
    uint256 public numOfAssessedDGDs;
    BuildingPermitContract public buildingPermitContract;
    bool public isClosed;

    struct AssessmentProviderStruct {
        bool exists; // Turn to false if assessment provider is removed
        bool hasReceivedDPP;
        address receivedDPPAddress;
        bool hasAssessedDPP;
        bool hasReceivedDGD;
        address receivedDGDAddress;
        bool hasAssessedDGD;
    }

    // This struct is used as parameter in functions sendDPP() and sendDGD()
    struct DocumentContractStruct {
        address assessmentProvider;
        Document[] attachments;
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
        require(address(buildingPermitContract) == address(0), 
        "This function cannot be called after building permit contract has been sent");
        _;
    }

    event AssessmentProviderAdded(address indexed _address);

    function addAssessmentProviders(address[] calldata _assessmentProviders) external onlyProjectManager DPPsInAssessment {
        for (uint256 i = 0; i < _assessmentProviders.length; i++) {
            require(!assessmentProviders[_assessmentProviders[i]].exists, "You can't add assessment provider that already exsists on a project");
            assessmentProviders[_assessmentProviders[i]] = AssessmentProviderStruct(true, false, address(0), false, false, address(0), false);
            assessmentProvidersAddresses.push(_assessmentProviders[i]);
            numOfAssessmentProviders++;
            emit AssessmentProviderAdded(_assessmentProviders[i]);
        }
    }

    event AssessmentProviderRemoved(address indexed _address);

    function removeAssessmentProviders(address[] calldata _assessmentProviders) external onlyProjectManager DPPsInAssessment {
        for (uint256 i = 0; i < _assessmentProviders.length; i++) {
            require(assessmentProviders[_assessmentProviders[i]].exists, "Assessment provider has to exist on a project");
            require(!assessmentProviders[_assessmentProviders[i]].hasAssessedDPP, "You can't remove assessmentProvider that has already assessed a DPP");
            assessmentProviders[_assessmentProviders[i]].exists = false;
            removeAssessmentProviderAddress(_assessmentProviders[i]);
            numOfAssessmentProviders--;
            emit AssessmentProviderRemoved(_assessmentProviders[i]);
        }
    }

    function removeAssessmentProviderAddress(address _address) internal {
        // Removes assessmentProvider's address from assessmentProvidersAddresses
        for (uint256 i = 0; i < assessmentProvidersAddresses.length; i++) {
            if (assessmentProvidersAddresses[i] == _address) {
                assessmentProvidersAddresses[i] = assessmentProvidersAddresses[assessmentProvidersAddresses.length - 1];
                assessmentProvidersAddresses.pop();
                break;
            }
        }
        // Removes sent DPP from sentDPPs array if it was received
        if (assessmentProviders[_address].hasReceivedDPP) {
            for (uint256 i = 0; i < sentDPPs.length; i++) {
                if (address(sentDPPs[i]) == assessmentProviders[_address].receivedDPPAddress) {
                    sentDPPs[i] = sentDPPs[sentDPPs.length - 1];
                    sentDPPs.pop();
                    break;
                }
            }
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

    function changeAdministrativeAuthority(address _administrativeAuthority) external onlyProjectManager hasNotBeenClosed {
        removeAdministrativeAuthority();
        setAdministrativeAuthority(_administrativeAuthority);
    }

    event DPPsent(address _address);

    event DPPset(uint256 timestamp, bytes32 documentHash);

    function setDPP(Document calldata _DPP) external onlyProjectManager DPPsInAssessment {
        require(_DPP.owner == projectManager, "Provided DPP's owner must be a project manager of this project");
        DPP = _DPP;
        for (uint256 i = 0; i < sentDPPs.length; i++) {
            sentDPPs[i].updateMainDocument();
        }
        emit DPPset(block.timestamp, DPP.documentHash);
    }

    function sendDPP(DocumentContractStruct[] calldata _sentDPPs) external onlyProjectManager DPPsInAssessment {
        require(DPP.owner != address(0), "DPP must be added in order to call this function");
        for (uint256 i = 0; i < _sentDPPs.length; i++) {
            require(assessmentProviders[_sentDPPs[i].assessmentProvider].exists, "Addressed assessment provider has to exsist on a project");
            require(!assessmentProviders[_sentDPPs[i].assessmentProvider].hasReceivedDPP, "Addressed assessment provider has already received a DPP");
            DocumentContract DPPContract = new DocumentContract(
                address(this),
                projectManager,
                _sentDPPs[i].assessmentProvider,
                _sentDPPs[i].attachments,
                DocumentContract.MainDocumentType.DPP
            );
            sentDPPs.push(DPPContract);
            assessmentProviders[_sentDPPs[i].assessmentProvider].hasReceivedDPP = true;
            assessmentProviders[_sentDPPs[i].assessmentProvider].receivedDPPAddress = address(DPPContract);
            emit DPPsent(address(DPPContract));
        }
    }

    event allDPPsAssessed();

    // DO NOT use directly! This is called from DocumentContract.provideAssessment()
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

    event DGDset(uint256 timestamp, bytes32 documentHash);

    function setDGD(Document calldata _DGD) external onlyProjectManager DGDsInAssessment {
        require(_DGD.owner == projectManager, "Provided DGD's owner must be a project manager of this project");
        DGD = _DGD;
        for (uint256 i = 0; i < sentDGDs.length; i++) {
            sentDGDs[i].updateMainDocument();
        }
        emit DPPset(block.timestamp, DGD.documentHash);
    }

    event DGDsent(address _address);

    function sendDGD(DocumentContractStruct[] calldata _sentDGDs) external onlyProjectManager DGDsInAssessment {
        require(DGD.owner != address(0), "DGD must be added in order to call this function");
        for (uint256 i = 0; i < _sentDGDs.length; i++) {
            require(assessmentProviders[_sentDGDs[i].assessmentProvider].exists, "Addressed assessment provider has to exsist on a project");
            require(!assessmentProviders[_sentDGDs[i].assessmentProvider].hasReceivedDGD, "Addressed assessment provider has already received a DGD");

            DocumentContract DGDContract = new DocumentContract(
                address(this),
                projectManager,
                _sentDGDs[i].assessmentProvider,
                _sentDGDs[i].attachments,
                DocumentContract.MainDocumentType.DGD
            );
            sentDGDs.push(DGDContract);
            assessmentProviders[_sentDGDs[i].assessmentProvider].hasReceivedDGD = true;
            assessmentProviders[_sentDGDs[i].assessmentProvider].receivedDGDAddress = address(DGDContract);
            emit DGDsent(address(DGDContract));
        }
    }

    event allDGDsAssessed();

    // DO NOT use directly! This is called from DocumentContract.provideAssessment()
    function assessDGD(address assessmentProvider) external DGDsInAssessment { 
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

    function getSentDPPs() public view returns (DocumentContract[] memory) {
        return sentDPPs;
    }

    function getSentDPPsAddresses() public view returns (DocumentContract[] memory) {
        return sentDPPs;
    }

    function getSentDGDsAddresses() public view returns (DocumentContract[] memory) {
        return sentDGDs;
    }

    function getAssessmentProvidersAddresses() public view returns (address[] memory) {
        return assessmentProvidersAddresses;
    }
}