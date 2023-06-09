// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.7.0 <0.9.0;

import "./DocumentContract.sol";
import "./BuildingPermitContract.sol";
import "./Document.sol";

import "../node_modules/hardhat/console.sol";

contract Project {
    address public immutable projectManager;
    mapping(address => AssessmentProviderStruct) public assessmentProviders;
    address[] public assessmentProvidersAddresses;
    uint256 public numOfAssessmentProviders;
    address public administrativeAuthority;
    Document public DPP;
    DocumentContract[] public sentDPPs;
    uint256 public numOfAssessedDPPs;
    bool public isDPPPhaseFinalized;
    Document public DGD;
    DocumentContract[] public sentDGDs;
    uint256 public numOfAssessedDGDs;
    BuildingPermitContract public buildingPermitContract;
    bool public isClosed;
    uint256 public dateCreated;

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

    event ProjectCreated(uint256 timestamp);

    constructor() {
        projectManager = msg.sender;
        dateCreated = block.timestamp;
        emit ProjectCreated(block.timestamp);
    }

    modifier onlyProjectManager() {
        require(
            msg.sender == projectManager,
            "Only the project manager can call this function"
        );
        _;
    }

    modifier DPPsInAssessment() {
        require(!isDPPPhaseFinalized, "This function cannot be called after DPP phase has been finalized");
        _;
    }

    modifier DGDsInAssessment() {
        require(isDPPPhaseFinalized, "This function cannot be called before DPP phase has been finalized");
        require(numOfAssessedDGDs < numOfAssessmentProviders, "This function cannot be called after all the DGDs have been assessed");
        _;
    }

    modifier hasNotBeenClosed() {
        require(
            address(buildingPermitContract) == address(0),
            "This function cannot be called after building permit contract has been sent"
        );
        _;
    }

    event AssessmentProviderAdded(address _address, uint256 timestamp);

    function addAssessmentProviders(
        address[] calldata _assessmentProviders
    ) external onlyProjectManager DPPsInAssessment {
        for (uint256 i = 0; i < _assessmentProviders.length; i++) {
            require(
                !assessmentProviders[_assessmentProviders[i]].exists,
                "You can't add assessment provider that already exsists on a project"
            );
            assessmentProviders[
                _assessmentProviders[i]
            ] = AssessmentProviderStruct(
                true,
                false,
                address(0),
                false,
                false,
                address(0),
                false
            );
            assessmentProvidersAddresses.push(_assessmentProviders[i]);
            numOfAssessmentProviders++;
            emit AssessmentProviderAdded(
                _assessmentProviders[i],
                block.timestamp
            );
        }
    }

    event AssessmentProviderRemoved(address _address, uint256 timestamp);

    function removeAssessmentProviders(
        address[] calldata _assessmentProviders
    ) external onlyProjectManager DPPsInAssessment {
        for (uint256 i = 0; i < _assessmentProviders.length; i++) {
            require(
                assessmentProviders[_assessmentProviders[i]].exists,
                "Assessment provider has to exist on a project"
            );
            require(
                !assessmentProviders[_assessmentProviders[i]].hasAssessedDPP,
                "You can't remove assessmentProvider that has already assessed a DPP"
            );
            assessmentProviders[_assessmentProviders[i]].exists = false;
            removeAssessmentProviderAddress(_assessmentProviders[i]);
            numOfAssessmentProviders--;
            emit AssessmentProviderRemoved(
                _assessmentProviders[i],
                block.timestamp
            );
        }
    }

    function removeAssessmentProviderAddress(address _address) internal {
        // Removes assessmentProvider's address from assessmentProvidersAddresses
        for (uint256 i = 0; i < assessmentProvidersAddresses.length; i++) {
            if (assessmentProvidersAddresses[i] == _address) {
                assessmentProvidersAddresses[i] = assessmentProvidersAddresses[
                    assessmentProvidersAddresses.length - 1
                ];
                assessmentProvidersAddresses.pop();
                break;
            }
        }
        // Removes sent DPP from sentDPPs array if it was received
        if (assessmentProviders[_address].hasReceivedDPP) {
            for (uint256 i = 0; i < sentDPPs.length; i++) {
                if (
                    address(sentDPPs[i]) ==
                    assessmentProviders[_address].receivedDPPAddress
                ) {
                    sentDPPs[i] = sentDPPs[sentDPPs.length - 1];
                    sentDPPs.pop();
                    break;
                }
            }
        }
    }

    event AdministrativeAuthoritySet(
        address _administrativeAuthority,
        uint256 timestamp
    );

    function setAdministrativeAuthority(
        address _administrativeAuthority
    ) public onlyProjectManager hasNotBeenClosed {
        require(
            administrativeAuthority == address(0),
            "Administrative authority has already been set"
        );
        administrativeAuthority = _administrativeAuthority;
        emit AdministrativeAuthoritySet(
            _administrativeAuthority,
            block.timestamp
        );
    }

    event AdministrativeAuthorityRemoved(
        address _administrativeAuthority,
        uint256 timestamp
    );

    function removeAdministrativeAuthority()
        public
        onlyProjectManager
        hasNotBeenClosed
    {
        address tempAddress = administrativeAuthority;
        administrativeAuthority = address(0);
        emit AdministrativeAuthorityRemoved(tempAddress, block.timestamp);
    }

    function changeAdministrativeAuthority(
        address _administrativeAuthority
    ) external onlyProjectManager hasNotBeenClosed {
        if (administrativeAuthority != address(0)) {
            removeAdministrativeAuthority();
        }
        setAdministrativeAuthority(_administrativeAuthority);
    }

    event DPPset(string documentId, uint256 timestamp);

    function setDPP(
        Document calldata _DPP
    ) external onlyProjectManager DPPsInAssessment {
        require(
            _DPP.owner == projectManager,
            "Provided DPP's owner must be a project manager of this project"
        );
        DPP = _DPP;
        for (uint256 i = 0; i < sentDPPs.length; i++) {
            sentDPPs[i].updateMainDocument();
        }
        emit DPPset(DPP.id, block.timestamp);
    }

    event DPPsent(address _address, uint256 timestamp);

    function sendDPP(
        DocumentContractStruct[] calldata _sentDPPs
    ) external onlyProjectManager DPPsInAssessment {
        require(
            DPP.owner != address(0),
            "DPP must be added in order to call this function"
        );
        for (uint256 i = 0; i < _sentDPPs.length; i++) {
            require(
                assessmentProviders[_sentDPPs[i].assessmentProvider].exists,
                "Addressed assessment provider has to exsist on a project"
            );
            require(
                !assessmentProviders[_sentDPPs[i].assessmentProvider]
                    .hasReceivedDPP,
                "Addressed assessment provider has already received a DPP"
            );
            DocumentContract DPPContract = new DocumentContract(
                address(this),
                projectManager,
                _sentDPPs[i].assessmentProvider,
                _sentDPPs[i].attachments,
                DocumentContract.MainDocumentType.DPP
            );
            sentDPPs.push(DPPContract);
            assessmentProviders[_sentDPPs[i].assessmentProvider]
                .hasReceivedDPP = true;
            assessmentProviders[_sentDPPs[i].assessmentProvider]
                .receivedDPPAddress = address(DPPContract);
            emit DPPsent(address(DPPContract), block.timestamp);
        }
    }

    event allDPPsAssessed(uint256 timestamp);

    // DO NOT use directly! This is called from DocumentContract.provideAssessment()
    function assessDPP(
        address assessmentProvider,
        bool requiresAssessment
    ) external DPPsInAssessment {
        // Called from DocumentContract.provideAssessment()
        require(
            assessmentProviders[assessmentProvider].exists = true,
            "Assessment provider has to exsist on a project"
        );
        require(
            !assessmentProviders[assessmentProvider].hasAssessedDPP,
            "This assessment provider has already assessed a DPP"
        );
        assessmentProviders[assessmentProvider].hasAssessedDPP = true;
        numOfAssessedDPPs++;
        if (!requiresAssessment) {
            assessmentProviders[assessmentProvider].hasAssessedDGD = true;
            numOfAssessedDGDs++;
        }
        if (numOfAssessedDPPs == numOfAssessmentProviders) {
            emit allDPPsAssessed(block.timestamp);
        }
    }

    event DGDset(string documentId, uint256 timestamp);

    function setDGD(
        Document calldata _DGD
    ) external onlyProjectManager DGDsInAssessment {
        require(
            _DGD.owner == projectManager,
            "Provided DGD's owner must be a project manager of this project"
        );
        DGD = _DGD;
        for (uint256 i = 0; i < sentDGDs.length; i++) {
            sentDGDs[i].updateMainDocument();
        }
        emit DGDset(DGD.id, block.timestamp);
    }

    event DGDsent(address _address, uint256 timestamp);

    function sendDGD(
        DocumentContractStruct[] calldata _sentDGDs
    ) external onlyProjectManager DGDsInAssessment {
        require(
            DGD.owner != address(0),
            "DGD must be added in order to call this function"
        );
        for (uint256 i = 0; i < _sentDGDs.length; i++) {
            require(
                assessmentProviders[_sentDGDs[i].assessmentProvider].exists,
                "Addressed assessment provider has to exsist on a project"
            );
            require(
                !assessmentProviders[_sentDGDs[i].assessmentProvider]
                    .hasReceivedDGD,
                "Addressed assessment provider has already received a DGD"
            );

            DocumentContract DGDContract = new DocumentContract(
                address(this),
                projectManager,
                _sentDGDs[i].assessmentProvider,
                _sentDGDs[i].attachments,
                DocumentContract.MainDocumentType.DGD
            );
            sentDGDs.push(DGDContract);
            assessmentProviders[_sentDGDs[i].assessmentProvider]
                .hasReceivedDGD = true;
            assessmentProviders[_sentDGDs[i].assessmentProvider]
                .receivedDGDAddress = address(DGDContract);
            emit DGDsent(address(DGDContract), block.timestamp);
        }
    }

    event allDGDsAssessed(uint256 timestamp);

    // DO NOT use directly! This is called from DocumentContract.provideAssessment()
    function assessDGD(address assessmentProvider) external DGDsInAssessment {
        require(
            assessmentProviders[assessmentProvider].exists = true,
            "Assessment provider has to exsist on a project"
        );
        require(
            !assessmentProviders[assessmentProvider].hasAssessedDGD,
            "This assessment provider has already assessed a DGD"
        );
        assessmentProviders[assessmentProvider].hasAssessedDGD = true;
        numOfAssessedDGDs++;
        if (numOfAssessedDGDs == numOfAssessmentProviders) {
            emit allDGDsAssessed(block.timestamp);
        }
    }

    event BuildingPermitContractCreated(address _address, uint256 timestamp);

    function createBuildingPermitContract() internal hasNotBeenClosed {
        require(
            administrativeAuthority != address(0),
            "Administrative authority has to be added in order to call this function"
        );
        BuildingPermitContract _buildingPermitContract = new BuildingPermitContract(
                address(this)
            );
        buildingPermitContract = _buildingPermitContract;
        emit BuildingPermitContractCreated(
            address(_buildingPermitContract),
            block.timestamp
        );
    }

    function getSentDPPsLength() public view returns (uint256) {
        return sentDPPs.length;
    }

    function getSentDGDsLength() public view returns (uint256) {
        return sentDGDs.length;
    }

    function getSentDPPs() public view returns (DocumentContract[] memory) {
        return sentDPPs;
    }

    function getSentDPPsAddresses()
        public
        view
        returns (DocumentContract[] memory)
    {
        return sentDPPs;
    }

    function getSentDGDsAddresses()
        public
        view
        returns (DocumentContract[] memory)
    {
        return sentDGDs;
    }

    function getAssessmentProvidersAddresses()
        public
        view
        returns (address[] memory)
    {
        return assessmentProvidersAddresses;
    }

    event DPPPhaseFinalized(uint256 timestamp);

    function finalizeDPPPhase() external {
        require(!isDPPPhaseFinalized, "This function cannot be called after DPP phase has been finalized");
        require(numOfAssessedDPPs == numOfAssessmentProviders, "This function cannot be called before all DPPs have been assessed");
        isDPPPhaseFinalized = true;
        emit DPPPhaseFinalized(block.timestamp);
    }
}
