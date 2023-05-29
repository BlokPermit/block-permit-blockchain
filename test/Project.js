const { expect } = require("chai");
const hre = require("hardhat");
const {getContractABI} = require("../api-testing/utils");
let DPP;
let DGD;


const EPOCH_DAY = 86400;

function addDaysToCurrentDate(days) {
  return Math.floor(new Date().getTime() / 1000 + days * EPOCH_DAY);
}

describe("Project", function () {
  let documentContract;
  let projectManager;
  let assessmentProvider;
  let mainDocument;
  let attachments;
  let mainDocumentType;
  let assessmentDueDate;
  let project;

  beforeEach(async function () {
    [
      projectManager,
      assessmentProvider1,
      assessmentProvider2,
      assessmentProvider3,
      administrativeAuthority,
    ] = await ethers.getSigners();

    DPP = {
      id: "dpp",
      owner: projectManager.address,
      documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("dpp")),
    }
    DGD = {
      id: "dgd",
      owner: projectManager.address,
      documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("dgd")),
    }

    assessmentDueDate = addDaysToCurrentDate(17);
    const ProjectFactory = await hre.ethers.getContractFactory("Project");
    projectContract = await ProjectFactory.deploy();
  });

  async function initializeDocumentContract(
    documentType, // true = DPP, false = DGD
    assessmentProviderAddress
  ) {
    const attachments = [
      {
        id: "id1",
        owner: projectManager.address,
        documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash2")),
      },
      {
        id: "id2",
        owner: projectManager.address,
        documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hash3")),
      },
    ];
    const mainDocumentType = documentType
      ? ethers.BigNumber.from("0")
      : ethers.BigNumber.from("1"); // DPP

    assessmentDueDate = addDaysToCurrentDate(17);

    const DocumentContractFactory = await hre.ethers.getContractFactory(
      "DocumentContract"
    );
    return await DocumentContractFactory.deploy(
      projectContract.address,
      projectManager.address,
      assessmentProviderAddress,
      attachments,
      mainDocumentType
    );
  }

  async function assessDocumentContract(
    documentContract,
    assessmentRequired = true
  ) {
    const assessmentProviderAddress =
      await documentContract.assessmentProvider();
    const assessmentProvider = await ethers.getSigner(
      assessmentProviderAddress
    );
    await documentContract.connect(assessmentProvider).provideAssessment(
      {
        dateProvided: addDaysToCurrentDate(0),
        assessmentMainDocument: {
          id: "id4",
          owner: assessmentProviderAddress,
          documentHash: ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes("hash4")
          ),
        },
        assessmentAttachments: [],
      },
      assessmentRequired
    );
  }

  describe("assessmentProviders", function () {
    it("should add assessment providers", async function () {
      const assessmentProviders = [
        assessmentProvider1.address,
        assessmentProvider2.address,
        assessmentProvider3.address,
      ];
      await projectContract.addAssessmentProviders(assessmentProviders);
      for (let i of assessmentProviders) {
        let assessmentProvider = await projectContract.assessmentProviders(i);
        expect(assessmentProvider.exists).equals(true);
      }
      expect(await projectContract.numOfAssessmentProviders()).equals(
        assessmentProviders.length
      );
    });

    it("should remove assessment providers", async function () {
      const assessmentProviders = [
        assessmentProvider1.address,
        assessmentProvider2.address,
        assessmentProvider3.address,
      ];
      await projectContract.addAssessmentProviders(assessmentProviders);
      const assessmentProvidersToRemove = [
        assessmentProvider1.address,
        assessmentProvider2.address,
      ];
      await projectContract.removeAssessmentProviders(
        assessmentProvidersToRemove
      );
      for (let i of assessmentProvidersToRemove) {
        let assessmentProvider = await projectContract.assessmentProviders(i);
        expect(assessmentProvider.exists).equals(false);
      }
      expect(await projectContract.numOfAssessmentProviders()).equals(
        assessmentProviders.length - assessmentProvidersToRemove.length
      );
    });

    it("should remove assessment provider and remove sent DPP from sentDPPs", async function () {
      let dpps = [];
      assessmentProviders = [
        assessmentProvider1.address,
        assessmentProvider2.address,
        assessmentProvider3.address,
      ];
      dpps = [];
      for (let i of assessmentProviders) {
        dpps.push({
          assessmentProvider: i,
          mainDocument: {
            id: "id1",
            owner: projectManager.address,
            documentHash: ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes("hash1")
            ),
          },
          attachments: [],
          assessmentDueDate: addDaysToCurrentDate(15),
        });
      }
      
      await projectContract.setDPP(DPP);
      await projectContract.addAssessmentProviders(assessmentProviders);
      await projectContract.sendDPP(dpps);
      const previousNumOfSentDPPs = await projectContract.getSentDPPsLength();
      const assessmentProvidersToRemove = [
        assessmentProvider1.address,
        assessmentProvider2.address,
      ];
      await projectContract.removeAssessmentProviders(
        assessmentProvidersToRemove
      );
      for (let i of assessmentProvidersToRemove) {
        let assessmentProvider = await projectContract.assessmentProviders(i);
        expect(assessmentProvider.exists).equals(false);
      }
      expect(await projectContract.getSentDPPsLength()).equals(
        previousNumOfSentDPPs - assessmentProvidersToRemove.length
      );
    });

    it("should revert if all DPPs have been assessed", async function () {
      const assessmentProviders = [
        assessmentProvider1.address,
        assessmentProvider2.address,
      ];
      await projectContract.addAssessmentProviders(assessmentProviders);
      let documentContracts = [];

      for (let i of assessmentProviders) {
        const documentContract = await initializeDocumentContract(true, i);
        await assessDocumentContract(documentContract);
        documentContracts.push(documentContract);
      }
      await expect(
        projectContract.addAssessmentProviders([assessmentProvider3.address])
      ).to.be.revertedWith(
        "This function cannot be called after all the DPPs have been assessed"
      );
    });
  });

  describe("adminstrativeAuthority", function () {
    it("should set administrative authority", async function () {
      await projectContract.setAdministrativeAuthority(
        administrativeAuthority.address
      );
      expect(await projectContract.administrativeAuthority()).equals(
        administrativeAuthority.address
      );
    });

    it("should not set administrative authority", async function () {
      await projectContract.setAdministrativeAuthority(
        administrativeAuthority.address
      );
      await expect(
        projectContract.setAdministrativeAuthority(assessmentProvider1.address)
      ).to.be.revertedWith("Administrative authority has already been set");
    });

    it("should remove administrative authority", async function () {
      await projectContract.removeAdministrativeAuthority();
      expect(await projectContract.administrativeAuthority()).equals(
        ethers.constants.AddressZero
      );
    });

    it("should change administrative authority", async function () {
      await projectContract.setAdministrativeAuthority(
        administrativeAuthority.address
      );
      await projectContract.changeAdministrativeAuthority(
        assessmentProvider1.address
      );
      expect(await projectContract.administrativeAuthority()).equals(
        assessmentProvider1.address
      );
    });
  });

  describe("setDPP", function() {
    let assessmentProviders = [];
    
    beforeEach(function() {
      assessmentProviders = [
        assessmentProvider1.address,
        assessmentProvider2.address,
        assessmentProvider3.address,
      ];
    });

    it("should set DPP", async function() {
      await projectContract.setDPP(DPP);
      const _dpp = await projectContract.DPP();
      expect(_dpp.documentHash).equals(DPP.documentHash);
    });

    it("should set DocumentContract's mainDocumentUpdateRequested to false", async function() {
      await projectContract.setDPP(DPP);
      await projectContract.addAssessmentProviders(assessmentProviders);
      await projectContract.sendDPP([{
        assessmentProvider: assessmentProviders[0],
        attachments: []
      }]);
      let docContract = await hre.ethers.getContractAt('DocumentContract', projectContract.sentDPPs(0));
      await docContract.connect(assessmentProvider1).requestMainDocumentUpdate();
      expect(await docContract.mainDocumentUpdateRequested()).equals(true);
      await projectContract.setDPP(DPP);
      expect(await docContract.mainDocumentUpdateRequested()).equals(false);
      
    });
  });

  describe("sendDPP", function () {
    let assessmentProviders = [];
    let dpps = [];

    beforeEach(async function () {
      assessmentProviders = [
        assessmentProvider1.address,
        assessmentProvider2.address,
        assessmentProvider3.address,
      ];
      dpps = [];
      for (let i of assessmentProviders) {
        dpps.push({
          assessmentProvider: i,
          mainDocument: {
            id: "id1",
            owner: projectManager.address,
            documentHash: ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes("hash1")
            ),
          },
          attachments: [],
          assessmentDueDate: addDaysToCurrentDate(15),
        });
      }
    });

    it("should send DPP", async function () {
      await projectContract.addAssessmentProviders(assessmentProviders);
      await projectContract.setDPP(DPP);
      await projectContract.sendDPP(dpps);
      for (let i of assessmentProviders) {
        const assessmentProvider = await projectContract.assessmentProviders(i);
        expect(assessmentProvider.hasReceivedDPP).equals(true);
      }

      for (let i = 0; i < dpps.length; i++) {
        const documentContractAddress = await projectContract.sentDPPs(i);
        const contractABI = await getContractABI("DocumentContract");
        const docContract = await new ethers.Contract(
          documentContractAddress,
          contractABI,
          projectManager
        );
        expect(await docContract.project()).equals(await projectContract.address);
        expect(await docContract.projectManager()).equals(await projectContract.projectManager());
      }
    });

    it("should revert if assessment provider does not exist on a project", async function () {
      await projectContract.setDPP(DPP);
      await expect(projectContract.sendDPP(dpps)).to.be.revertedWith(
        "Addressed assessment provider has to exsist on a project"
      );
    });

    it("should revert if DPP has not been set", async function () {
      await expect(projectContract.sendDPP(dpps)).to.be.revertedWith(
        "DPP must be added in order to call this function"
      );
    });

    it("should revert if assessment provider has already recieved a dpp", async function () {
      await projectContract.addAssessmentProviders(assessmentProviders);
      await projectContract.setDPP(DPP);
      await projectContract.sendDPP(dpps);
      await expect(projectContract.sendDPP(dpps)).to.be.revertedWith(
        "Addressed assessment provider has already received a DPP"
      );
    });
  });

  describe("assess DPP", function () {
    let assessmentProviders = [];
    let dpps = [];

    beforeEach(async function () {
      assessmentProviders = [
        assessmentProvider1.address,
        assessmentProvider2.address,
        assessmentProvider3.address,
      ];
      dpps = [];
      for (let i of assessmentProviders) {
        dpps.push({
          assessmentProvider: i,
          mainDocument: {
            id: "id1",
            owner: projectManager.address,
            documentHash: ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes("hash1")
            ),
          },
          attachments: [],
          assessmentDueDate: addDaysToCurrentDate(15),
        });
      }
      await projectContract.addAssessmentProviders(assessmentProviders);
      await projectContract.setDPP(DPP);
      await projectContract.sendDPP(dpps);
    });

    it("should assess DPP", async function () {
      const sentDPPsLength = await projectContract.getSentDPPsLength();
      for (let i = 0; i < sentDPPsLength; i++) {
        const documentContract = await ethers.getContractAt(
          "DocumentContract",
          await projectContract.sentDPPs(i)
        );
        await assessDocumentContract(documentContract);
        const assessmentProvider = await projectContract.assessmentProviders(
          assessmentProviders[i]
        );
        expect(await assessmentProvider.hasAssessedDPP).equals(true);
      }
      expect(await projectContract.numOfAssessedDPPs()).equals(
        await projectContract.numOfAssessmentProviders()
      );
    });

    it("should increase the number of assessed DGDs when DPP requires no assessment", async function () {
      const sentDPPsLength = await projectContract.getSentDPPsLength();
      for (let i = 0; i < sentDPPsLength; i++) {
        const documentContract = await ethers.getContractAt(
          "DocumentContract",
          await projectContract.sentDPPs(i)
        );
        await assessDocumentContract(documentContract, false);
      }
      expect(await projectContract.numOfAssessedDPPs()).equals(
        await projectContract.numOfAssessedDGDs()
      );
    });

    it("should revert when assessment provider has already assessed a DPP", async function () {
      const sentDPPsLength = await projectContract.getSentDPPsLength();
      for (let i = 0; i < sentDPPsLength; i++) {
        const documentContract = await ethers.getContractAt(
          "DocumentContract",
          await projectContract.sentDPPs(i)
        );
        await assessDocumentContract(documentContract);
        const assessmentProvider = await projectContract.assessmentProviders(
          assessmentProviders[i]
        );
      }
      expect(
        assessDocumentContract(
          await ethers.getContractAt(
            "DocumentContract",
            await projectContract.sentDPPs(0)
          )
        )
      ).to.be.revertedWith(
        "This function can only be called when assessment hasn't finsihed yet"
      );
    });
  });

  describe("setDGD", function() {
    let assessmentProviders = [];
    let dpds = [];
    let dgds = [];

    beforeEach(async function () {
      assessmentProviders = [
        assessmentProvider1.address,
        assessmentProvider2.address,
        assessmentProvider3.address,
      ];
      dpps = [];
      for (let i of assessmentProviders) {
        dpps.push({
          assessmentProvider: i,
          mainDocument: {
            id: "id1",
            owner: projectManager.address,
            documentHash: ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes("hash1")
            ),
          },
          attachments: [],
          assessmentDueDate: addDaysToCurrentDate(15),
        });
      }
      await projectContract.addAssessmentProviders(assessmentProviders);
      await projectContract.setDPP(DPP);
      await projectContract.sendDPP(dpps);

      const sentDPPsLength = await projectContract.getSentDPPsLength();
      for (let i = 0; i < sentDPPsLength; i++) {
        const documentContract = await ethers.getContractAt(
          "DocumentContract",
          await projectContract.sentDPPs(i)
        );
        await assessDocumentContract(documentContract);
      }

      for (let i of assessmentProviders) {
        dgds.push({
          assessmentProvider: i,
          attachments: [],
        });
      }
    });

    it("should set DGD", async function() {
      await projectContract.setDGD(DGD);
      const _dgd = await projectContract.DGD();
      expect(_dgd.documentHash).equals(DGD.documentHash);
    });
  });

  describe("sendDGD", function () {
    let assessmentProviders = [];
    let dpds = [];
    let dgds = [];

    beforeEach(async function () {
      assessmentProviders = [
        assessmentProvider1.address,
        assessmentProvider2.address,
        assessmentProvider3.address,
      ];
      dpps = [];
      for (let i of assessmentProviders) {
        dpps.push({
          assessmentProvider: i,
          mainDocument: {
            id: "id1",
            owner: projectManager.address,
            documentHash: ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes("hash1")
            ),
          },
          attachments: [],
          assessmentDueDate: addDaysToCurrentDate(15),
        });
      }
      await projectContract.addAssessmentProviders(assessmentProviders);
      await projectContract.setDPP(DPP);
      await projectContract.sendDPP(dpps);

      const sentDPPsLength = await projectContract.getSentDPPsLength();
      for (let i = 0; i < sentDPPsLength; i++) {
        const documentContract = await ethers.getContractAt(
          "DocumentContract",
          await projectContract.sentDPPs(i)
        );
        await assessDocumentContract(documentContract);
      }

      for (let i of assessmentProviders) {
        dgds.push({
          assessmentProvider: i,
          mainDocument: {
            id: "id1",
            owner: projectManager.address,
            documentHash: ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes("hash1")
            ),
          },
          attachments: [],
          assessmentDueDate: addDaysToCurrentDate(15),
        });
      }
    });

    it("should send DGD", async function () {
      await projectContract.setDGD(DGD);
      await projectContract.sendDGD(dgds);
      for (let i of assessmentProviders) {
        const assessmentProvider = await projectContract.assessmentProviders(i);
        expect(assessmentProvider.hasReceivedDGD).equals(true);
      }
      expect(await projectContract.numOfSentDGDs).equals(
        (await projectContract.numOfSentDPDs) &&
          (await projectContract.numOfAssessmentProviders)
      );
    });

    it("should revert if DGD has not been set", async function () {
      await expect(projectContract.sendDGD(dgds)).to.be.revertedWith(
        "DGD must be added in order to call this function"
      );
    });
  });

  describe("assess DGD", function () {
    let assessmentProviders = [];
    let dpds = [];
    let dgds = [];

    beforeEach(async function () {
      assessmentProviders = [
        assessmentProvider1.address,
        assessmentProvider2.address,
        assessmentProvider3.address,
      ];
      dpps = [];
      for (let i of assessmentProviders) {
        dpps.push({
          assessmentProvider: i,
          mainDocument: {
            id: "id1",
            owner: projectManager.address,
            documentHash: ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes("hash1")
            ),
          },
          attachments: [],
          assessmentDueDate: addDaysToCurrentDate(15),
        });
      }
      await projectContract.addAssessmentProviders(assessmentProviders);
      await projectContract.setDPP(DPP);
      await projectContract.sendDPP(dpps);

      const sentDPPsLength = await projectContract.getSentDPPsLength();
      for (let i = 0; i < sentDPPsLength; i++) {
        const documentContract = await ethers.getContractAt(
          "DocumentContract",
          await projectContract.sentDPPs(i)
        );
        await assessDocumentContract(documentContract);
      }

      dgds = [];
      for (let i of assessmentProviders) {
        dgds.push({
          assessmentProvider: i,
          mainDocument: {
            id: "id1",
            owner: projectManager.address,
            documentHash: ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes("hash1")
            ),
          },
          attachments: [],
          assessmentDueDate: addDaysToCurrentDate(15),
        });
      }
      await projectContract.setDGD(DGD);
      await projectContract.sendDGD(dgds);
    });

    it("should assess DGD", async function () {
      const sentDGDsLength = await projectContract.getSentDGDsLength();
      for (let i = 0; i < sentDGDsLength; i++) {
        const documentContract = await ethers.getContractAt(
          "DocumentContract",
          await projectContract.sentDGDs(i)
        );
        await assessDocumentContract(documentContract);
        const assessmentProvider = await projectContract.assessmentProviders(
          assessmentProviders[i]
        );
        expect(await assessmentProvider.hasReceivedDGD).equals(true);
      }
      expect(await projectContract.numOfAssessedDGDs()).equals(
        await projectContract.numOfAssessmentProviders()
      );
    });

    it("should revert when all DGDs have already been assessed", async function () {
      const sentDGDsLength = await projectContract.getSentDGDsLength();
      for (let i = 0; i < sentDGDsLength; i++) {
        const documentContract = await ethers.getContractAt(
          "DocumentContract",
          await projectContract.sentDGDs(i)
        );
        await assessDocumentContract(documentContract);
        const assessmentProvider = await projectContract.assessmentProviders(
          assessmentProviders[i]
        );
      }
      const documentContract = await ethers.getContractAt(
        "DocumentContract",
        await projectContract.sentDGDs(0)
      );
      await expect(assessDocumentContract(documentContract))
      .to.be.revertedWith("This function can only be called when assessment hasn't finsihed yet");
    });
  });
});
