// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.7.0 <0.9.0;

import "./Document.sol";
import "./Project.sol";
import "../node_modules/hardhat/console.sol";

contract DocumentContract {
    address public project;
    address public immutable projectManager;
    address public immutable assessmentProvider;
    Document[] public attachments;
    MainDocumentType public mainDocumentType;
    bool public mainDocumentUpdateRequested;
    uint256 public dateCreated;
    uint256 public assessmentDueDate;
    uint256 public requestedAssessmentDueDate;
    Assessment public assessment;
    bool public isClosed; // True when assessment has been recieved

    struct Assessment {
        uint256 dateProvided;
        Document assessmentMainDocument;
        Document[] assessmentAttachments;
    }

    enum MainDocumentType {
        DPP,
        DGD
    }

    event DocumentContractCreated(uint256 timestamp);

    constructor(
        address _project,
        address _projectManager,
        address _assessmentProvider,
        Document[] memory _attachments,
        MainDocumentType _mainDocumentType
    ) {
        project = _project;
        projectManager = _projectManager;
        assessmentProvider = _assessmentProvider;
        mainDocumentType = _mainDocumentType;
        dateCreated = block.timestamp;
        assessmentDueDate = dateCreated + 15 days;
        for (uint256 i = 0; i < _attachments.length; i++) {
            attachments.push(_attachments[i]);
        }
        emit DocumentContractCreated(block.timestamp);
    }

    modifier onlyProjectManager() {
        require(
            msg.sender == projectManager,
            "Only the project manager can call this function"
        );
        _;
    }

    modifier onlyAssessmentProvider() {
        require(
            msg.sender == assessmentProvider,
            "Only the assessment provider can call this function"
        );
        _;
    }

    modifier isBeingAssessed() {
        require(
            !isClosed,
            "This function can only be called when assessment hasn't finsihed yet"
        );
        _;
    }

    modifier hasBeenAssessed() {
        require(
            isClosed,
            "This function can only be called when assessment has finsihed"
        );
        _;
    }

    function compareStrings(
        string memory a,
        string memory b
    ) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }

    event AttachmentAdded(string id, uint256 timestamp);

    function addAttachments(
        Document[] calldata _attachments
    ) external onlyProjectManager isBeingAssessed {
        for (uint256 i = 0; i < _attachments.length; i++) {
            require(
                _attachments[i].owner == projectManager,
                "Only the project manager can add attachments"
            );
            attachments.push(_attachments[i]);
            emit AttachmentAdded(_attachments[i].id, block.timestamp);
        }
    }

    event AttachmentRemoved(string id, uint256 timestamp);

    function removeAttachments(
        string[] calldata _attachmentIds
    ) external onlyProjectManager isBeingAssessed {
        for (uint256 i = 0; i < _attachmentIds.length; i++) {
            for (uint256 j = 0; j < attachments.length; j++) {
                if (compareStrings(_attachmentIds[i], attachments[j].id)) {
                    string memory tempId = attachments[j].id;
                    bytes32 tempDocumentHash = attachments[j].documentHash;
                    attachments[j] = attachments[attachments.length - 1];
                    attachments.pop();
                    emit AttachmentRemoved(tempId, block.timestamp);
                    break;
                }
            }
        }
    }

    event MainDocumentUpdateRequested(uint256 timestamp);

    function requestMainDocumentUpdate()
        external
        onlyAssessmentProvider
        isBeingAssessed
    {
        require(
            !mainDocumentUpdateRequested,
            "Main document update demand has already been recieved"
        );
        mainDocumentUpdateRequested = true;
        emit MainDocumentUpdateRequested(block.timestamp);
    }

    function updateMainDocument() external {
        require(
            msg.sender == project,
            "This function can only be called from project"
        );
        mainDocumentUpdateRequested = false;
    }

    event AssessmentDueDateExtensionRequested(
        uint256 requestedDueDate,
        uint256 timestamp
    );

    function requestAssessmentDueDateExtension(
        uint256 _requestedAssessmentDueDate
    ) public onlyAssessmentProvider isBeingAssessed {
        require(
            _requestedAssessmentDueDate >= assessmentDueDate,
            "Requested due date has to be later in the future than current due date"
        );
        require(
            _requestedAssessmentDueDate <= dateCreated + 60 days,
            "Requested due date has to be sooner than date of creation + 60 days"
        );
        requestedAssessmentDueDate = _requestedAssessmentDueDate;
        emit AssessmentDueDateExtensionRequested(
            _requestedAssessmentDueDate,
            block.timestamp
        );
    }

    event AssessmentDueDateExtensionEvaluated(
        bool requestConfirmed,
        uint256 timestamp
    );

    function evaluateAssessmentDueDateExtension(
        bool confirm
    ) external onlyProjectManager isBeingAssessed {
        require(
            requestedAssessmentDueDate != 0,
            "Due date extension has not been requested"
        );
        if (confirm) {
            assessmentDueDate = requestedAssessmentDueDate;
            requestedAssessmentDueDate = 0;
        }
        emit AssessmentDueDateExtensionEvaluated(confirm, block.timestamp);
    }

    event AssessmentProvided(string assessmentId, uint256 timestamp);

    // It doesn't matter which dateProvided you set to the assessment as it will automatically set to current date. But you still need to pass it in correct format
    function provideAssessment(
        Assessment calldata _assessment,
        bool requiresAssessment
    ) external onlyAssessmentProvider isBeingAssessed {
        require(
            _assessment.assessmentMainDocument.owner == assessmentProvider,
            "Only the assessment provider can provide the main document of an assessment"
        );
        for (uint256 i = 0; i < _assessment.assessmentAttachments.length; i++) {
            require(
                _assessment.assessmentAttachments[i].owner ==
                    assessmentProvider,
                "Only the assessment provider can provide attachments of an assessment"
            );
        }
        assessment = _assessment;
        assessment.dateProvided = block.timestamp;
        isClosed = true;
        mainDocumentType == MainDocumentType.DPP
            ? Project(project).assessDPP(assessmentProvider, requiresAssessment)
            : Project(project).assessDGD(assessmentProvider);
        emit AssessmentProvided(
            _assessment.assessmentMainDocument.id,
            block.timestamp
        );
    }

    event AssessmentAttachmentAdded(string id, uint256 timestamp);

    function addAssessmentAttachments(
        Document[] calldata _assessmentAttachments
    ) external onlyAssessmentProvider hasBeenAssessed {
        for (uint256 i = 0; i < _assessmentAttachments.length; i++) {
            require(
                _assessmentAttachments[i].owner == assessmentProvider,
                "Only the assessment provider can add assessment attachments"
            );
            assessment.assessmentAttachments.push(_assessmentAttachments[i]);
            emit AssessmentAttachmentAdded(
                _assessmentAttachments[i].id,
                block.timestamp
            );
        }
    }

    event AssessmentAttachmentRemoved(string id, uint256 timestamp);

    function removeAssessmentAttachments(
        string[] calldata _assessmentAttachmentIds
    ) external onlyAssessmentProvider hasBeenAssessed {
        for (uint256 i = 0; i < _assessmentAttachmentIds.length; i++) {
            for (
                uint256 j = 0;
                j < assessment.assessmentAttachments.length;
                j++
            ) {
                if (
                    compareStrings(
                        _assessmentAttachmentIds[i],
                        assessment.assessmentAttachments[j].id
                    )
                ) {
                    string memory tempId = assessment
                        .assessmentAttachments[j]
                        .id;
                    bytes32 tempDocumentHash = assessment
                        .assessmentAttachments[j]
                        .documentHash;
                    assessment.assessmentAttachments[j] = assessment
                        .assessmentAttachments[
                            assessment.assessmentAttachments.length - 1
                        ];
                    assessment.assessmentAttachments.pop();
                    emit AttachmentRemoved(tempId, block.timestamp);
                    break;
                }
            }
        }
    }

    event AssessmentMainDocumentUpdated(string indexed id, uint256 timestamp);

    function updateAssessmentMainDocument(
        Document calldata updatedAssessmentMainDocument
    ) external onlyAssessmentProvider hasBeenAssessed {
        require(
            updatedAssessmentMainDocument.owner == assessmentProvider,
            "Only the project manager can update the main document"
        );
        assessment.assessmentMainDocument = updatedAssessmentMainDocument;
        emit AssessmentMainDocumentUpdated(
            updatedAssessmentMainDocument.id,
            block.timestamp
        );
    }

    event DeadlineExceeded(uint256 timestamp);

    function isDeadlineExceeded() public returns (bool) {
        if (block.timestamp > assessmentDueDate) {
            emit DeadlineExceeded(block.timestamp);
            return true;
        } else {
            return false;
        }
    }

    function getAttachmentById(
        string calldata id
    ) public view returns (Document memory) {
        for (uint256 i = 0; i < attachments.length; i++) {
            if (compareStrings(attachments[i].id, id)) {
                return attachments[i];
            }
        }
        revert("Attachment with provided ID not found");
    }

    function getAssessmentAttachmentById(
        string calldata id
    ) public view returns (Document memory) {
        for (uint256 i = 0; i < assessment.assessmentAttachments.length; i++) {
            if (compareStrings(assessment.assessmentAttachments[i].id, id)) {
                return assessment.assessmentAttachments[i];
            }
        }
        revert("Attachment with provided ID not found");
    }

    function getAttachments() public view returns (Document[] memory) {
        return attachments;
    }

    function getAssessmentAttachments()
        public
        view
        returns (Document[] memory)
    {
        return assessment.assessmentAttachments;
    }

    // Because the lengths of public arrays aren't exposed by default
    function getAttachmentsLength() public view returns (uint256) {
        return attachments.length;
    }

    function getAssessmentAttachmentsLength() public view returns (uint256) {
        return assessment.assessmentAttachments.length;
    }
}
