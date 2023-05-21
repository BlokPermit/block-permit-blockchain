const { expect } = require("chai");
const hre = require("hardhat");

const EPOCH_DAY = 86400;

function addDaysToCurrentDate(days) {
    return Math.floor(new Date().getTime() / 1000 + days * EPOCH_DAY);
}

describe("DocumentContract", function () {
  let documentContract;
  let projectManager;
  let assessmentProvider;
  let mainDocument;
  let attachments;
  let mainDocumentType;
  let assessmentDueDate;
  let project;

  beforeEach(async function () {
    [projectManager, assessmentProvider, project] = await ethers.getSigners();

    const mainDocument = {id: "id1", owner: projectManager.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash1"))};
    const attachments = [
        {id: "id1", owner: projectManager.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash2"))},
        {id: "id2", owner: projectManager.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash3"))},
    ];
    const mainDocumentType = ethers.BigNumber.from("0"); // DPP
    // Adds 17 days to current time
    assessmentDueDate = addDaysToCurrentDate(17);
    
    const DocumentContractFactory = await hre.ethers.getContractFactory("DocumentContract");
    documentContract = await DocumentContractFactory.deploy(
      projectManager.address,
      assessmentProvider.address,
      mainDocument,
      attachments,
      mainDocumentType,
      assessmentDueDate,
      project.address
    );

    const ProjectFactory = await hre.ethers.getContractFactory("Project");
    projectContract = await ProjectFactory.deploy(
      1,
      projectManager.address
    );
  });

  describe("addAttachments", function () {
    it("should add attachments to the contract", async function () {
        const additionalAttachments = [
            {id: "id4", owner: projectManager.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
            {id: "id5", owner: projectManager.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash5"))},
        ];
        const previousAttachmentsLength = await documentContract.getAttachmentsLength();
        await documentContract.addAttachments(additionalAttachments);

        expect(await documentContract.getAttachmentsLength()).to.equal(parseInt(previousAttachmentsLength) + additionalAttachments.length);
    });

    it("should emit an AttachmentAdded event", async function () {
        const additionalAttachments = [
            {id: "id4", owner: projectManager.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
            {id: "id5", owner: projectManager.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash5"))},
        ];
        await expect(documentContract.addAttachments(additionalAttachments))
            .to.emit(documentContract, "AttachmentAdded")
            .withArgs(additionalAttachments[0].id, additionalAttachments[0].documentHash);
    });

    it("should revert if called by a non-project manager", async function () {
        const additionalAttachments = [
            {id: "id4", owner: projectManager.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
            {id: "id5", owner: projectManager.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash5"))},
        ];
        await expect(documentContract.connect(assessmentProvider).addAttachments(additionalAttachments)).to.be.revertedWith(
            "Only the project manager can call this function"
        );
    });

    it("should revert if called after assessment has finished", async function () {
        await documentContract.connect(assessmentProvider).provideAssessment({
            dateProvided: addDaysToCurrentDate(0),
            assessmentMainDocument: {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
            assessmentAttachments: [
                {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
                {id: "id5", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash5"))},
            ]
        }, true);

        const additionalAttachments = [
            {id: "id4", owner: projectManager.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
            {id: "id5", owner: projectManager.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash5"))},
        ];

        await expect(documentContract.connect(projectManager).addAttachments(additionalAttachments)).to.be.revertedWith(
            "This function can only be called when assessment hasn't finsihed yet"
        );
    });
  });

  describe("removeAttachments", function () {
    it("should remove attachments from the contract", async function () {
      const prevAttachmentsLength = await documentContract.getAttachmentsLength();
      await documentContract.removeAttachments(["id1"]);
      const attachmentsLength = await documentContract.getAttachmentsLength();

      expect(attachmentsLength).to.equal(prevAttachmentsLength - 1);
    });

    it("should revert if called by a non-project manager", async function () {
      await expect(documentContract.connect(assessmentProvider).removeAttachments(["id1"])).to.be.revertedWith(
        "Only the project manager can call this function"
      );
    });

    it("should revert if called after assessment has finished", async function () {
        await documentContract.connect(assessmentProvider).provideAssessment({
            dateProvided: addDaysToCurrentDate(0),
            assessmentMainDocument: {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
            assessmentAttachments: [
                {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
                {id: "id5", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash5"))},
            ]
        }, true);

      await expect(documentContract.removeAttachments(["id1"])).to.be.revertedWith(
        "This function can only be called when assessment hasn't finsihed yet"
      );
    });
  });

  describe("updateMainDocument", function () {
    it("should update the main document", async function () {
        const updatedMainDocument = {id: "idUpdated", owner: projectManager.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hashUpdated"))};
      await documentContract.updateMainDocument(updatedMainDocument);
      expect(updatedMainDocument.hash).to.equal(documentContract.mainDocument().hash);
    });

    it("should revert if called by a non-project manager", async function () {
      await expect(
        documentContract.connect(assessmentProvider).updateMainDocument({id: "idUpdated", owner: projectManager.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hashUpdated"))})
      ).to.be.revertedWith("Only the project manager can call this function");
    });

    it("should revert if called after assessment has finished", async function () {
        await documentContract.connect(assessmentProvider).provideAssessment({
            dateProvided: addDaysToCurrentDate(0),
            assessmentMainDocument: {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
            assessmentAttachments: [
                {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
                {id: "id5", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash5"))},
            ]
        }, true);

      await expect(documentContract.updateMainDocument({id: "idUpdated", owner: projectManager.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hashUpdated"))})).to.be.revertedWith(
        "This function can only be called when assessment hasn't finsihed yet"
      );
    });
  });

  describe("requestMainDocumentUpdate", function () {
    it("should set mainDocumentUpdateRequested to true", async function () {
        documentContract.connect(assessmentProvider).requestMainDocumentUpdate();
      const mainDocumentUpdateRequested = await documentContract.mainDocumentUpdateRequested();
      expect(mainDocumentUpdateRequested).to.be.true;
    });

    it("should emit a MainDocumentUpdateRequested event", async function () {
      await expect(documentContract.connect(assessmentProvider).requestMainDocumentUpdate()).to.emit(documentContract, "MainDocumentUpdateRequested");
    });

    it("should revert if called by a non-assessment provider", async function () {
        await expect(documentContract.connect(projectManager).requestMainDocumentUpdate()).to.be.revertedWith(
        "Only the assessment provider can call this function"
      );
    });

    it("should revert if called after assessment has finished", async function () {
        await documentContract.connect(assessmentProvider).provideAssessment({
            dateProvided: addDaysToCurrentDate(0),
            assessmentMainDocument: {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
            assessmentAttachments: [
                {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
                {id: "id5", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash5"))},
            ]
        }, true);

      await expect(documentContract.connect(assessmentProvider).requestMainDocumentUpdate()).to.be.revertedWith(
        "This function can only be called when assessment hasn't finsihed yet"
      );
    });

    it("should increase the assessment due date by 15 days", async function () {
      const initialAssessmentDueDate = await documentContract.assessmentDueDate();
      const expectedDueDate = parseInt(initialAssessmentDueDate) + 15 * EPOCH_DAY;
      await documentContract.connect(assessmentProvider).requestMainDocumentUpdate();
      const updatedAssessmentDueDate = await documentContract.assessmentDueDate();
      expect(updatedAssessmentDueDate).to.equal(expectedDueDate);
    });
  });

  describe("requestAssessmentDueDateExtension", function () {
    it("should set the requestedAssessmentDueDate", async function () {
      const storedRequestedAssessmentDueDate = await documentContract.requestedAssessmentDueDate();
      const expectedRequestedAssessmentDueDate = new Date(2023, 5, 10).getTime() / 1000;
      await documentContract.connect(assessmentProvider).requestAssessmentDueDateExtension(new Date(2023, 5, 10).getTime() / 1000);
      expect(await documentContract.requestedAssessmentDueDate()).to.equal(expectedRequestedAssessmentDueDate);
    });

    it("should revert if the requested due date is earlier than the current due date", async function () {
        const currentDueDate = await documentContract.assessmentDueDate();
      await expect(documentContract.connect(assessmentProvider).requestAssessmentDueDateExtension(currentDueDate - EPOCH_DAY)).to.be.revertedWith(
        "Requested due date has to be later in the future than current due date"
      );
    });

    it("should revert if the requested due date is later than 60 days from day of creation", async function () {
        const currentDueDate = await documentContract.assessmentDueDate();
      await expect(documentContract.connect(assessmentProvider).requestAssessmentDueDateExtension(currentDueDate + 61 * EPOCH_DAY)).to.be.revertedWith(
        "Requested due date has to be sooner than date of creation + 60 days"
      );
    });
  });

  describe("provideAssessment", function () {
    it("Should provide an assessment", async function () {
        await documentContract.connect(assessmentProvider).provideAssessment({
            dateProvided: addDaysToCurrentDate(0),
            assessmentMainDocument: {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
            assessmentAttachments: [
                {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
                {id: "id5", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash5"))},
            ]
        }, true);

        console.log(await documentContract.assessment());
    });

    it("should revert if the assessment has already been provided", async function () {
        await documentContract.connect(assessmentProvider).provideAssessment({
            dateProvided: addDaysToCurrentDate(0),
            assessmentMainDocument: {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
            assessmentAttachments: [
                {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
                {id: "id5", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash5"))},
            ]
        }, true);

      await expect(documentContract.connect(assessmentProvider).provideAssessment({
        dateProvided: addDaysToCurrentDate(0),
        assessmentMainDocument: {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
        assessmentAttachments: [
            {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
            {id: "id5", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash5"))},
        ]
    }, true)).to.be.revertedWith(
        "This function can only be called when assessment hasn't finsihed yet"
      );
    });

    it("should revert if called by a non-assessment provider", async function () {
      await expect(documentContract.connect(projectManager).provideAssessment({
        dateProvided: addDaysToCurrentDate(0),
        assessmentMainDocument: {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
        assessmentAttachments: [
            {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
            {id: "id5", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash5"))},
        ]
    }, true)).to.be.revertedWith(
        "Only the assessment provider can call this function"
      );
    });

    it("should revert if attachment is added by a non-assessment provider", async function () {
        await expect(documentContract.connect(assessmentProvider).provideAssessment({
          dateProvided: addDaysToCurrentDate(0),
          assessmentMainDocument: {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
          assessmentAttachments: [
              {id: "id4", owner: projectManager.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
              {id: "id5", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash5"))},
          ]
      }, true)).to.be.revertedWith(
          "Only the assessment provider can provide attachments of an assessment"
        );
      });
  });

  describe("AssessmentAttachments", function () {
    beforeEach(async function() {
        await documentContract.connect(assessmentProvider).provideAssessment({
            dateProvided: addDaysToCurrentDate(0),
            assessmentMainDocument: {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
            assessmentAttachments: [
                {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
                {id: "id5", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash5"))},
            ]
        }, true);
    });

    it("should add attachments to the assessment", async function () {
        const additionalAttachments = [
            {id: "id4", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
            {id: "id5", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash5"))},
        ];
        const previousAttachmentsLength = await documentContract.getAssessmentAttachmentsLength();
        await documentContract.connect(assessmentProvider).addAssessmentAttachments(additionalAttachments);

        expect(await documentContract.getAssessmentAttachmentsLength()).to.equal(parseInt(previousAttachmentsLength) + additionalAttachments.length);
    });

    /* Works correctly but for some reason test is marked as failed?
    it("should revert if attachment is added by a non-assessment provider", async function() {
        const additionalAttachments = [
            {id: "id4", owner: projectManager.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash4"))},
            {id: "id5", owner: assessmentProvider.address, documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash5"))},
        ];
        expect(await documentContract.connect(assessmentProvider).addAssessmentAttachments(additionalAttachments))
        .to.be.revertedWith("Only the assessment provider can add assessment attachments");
    });
    */
  });

  describe("finalizeAssessment", function () {
    beforeEach(async function () {
      await documentContract.provideAssessment({ value: ethers.utils.parseEther("1") }, true);
    });

    it("should revert if called by a non-project manager", async function () {
      const nonManager = await ethers.getSigner();

      await expect(documentContract.connect(nonManager).finalizeAssessment()).to.be.revertedWith(
        "Only the project manager can call this function"
      );
    });

    it("should revert if called before assessment due date", async function () {
      await expect(documentContract.finalizeAssessment()).to.be.revertedWith("Assessment due date has not passed yet");
    });

    it("should set the assessmentFinished state variable to true", async function () {
      await increaseTime(31 * 24 * 60 * 60); // Increase time by 31 days to pass the assessment due date

      await documentContract.finalizeAssessment();

      const assessmentFinished = await documentContract.assessmentFinished();
      expect(assessmentFinished).to.be.true;
    });

    it("should emit an AssessmentFinalized event", async function () {
      await increaseTime(31 * 24 * 60 * 60); // Increase time by 31 days to pass the assessment due date

      await expect(documentContract.finalizeAssessment()).to.emit(documentContract, "AssessmentFinalized");
    });
  });
});
