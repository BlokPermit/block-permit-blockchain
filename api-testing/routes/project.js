require("dotenv").config();
const express = require("express");
const hre = require("hardhat");
const router = express();
const {
    getContractABI,
    getOwnerContract,
    addDaysToCurrentDate,
    parseDocument,
    getHash
} = require("../utils");

var ownerContract;
var contractABI;
const provider = ethers.getDefaultProvider();

router.use(express.urlencoded({extended: true}), beforeEach);

async function initialize() {
    contractABI = await getContractABI("Project");
    ownerContract = await getOwnerContract();
}

async function getContract(address, signer = false) {
    try {
        // see https://docs.ethers.org/v5/api/contract/contract/
        if (signer) {
            return new ethers.Contract(address, contractABI, await ethers.getSigner());
        } else {
            const provider = await ethers.getDefaultProvider();
            return new ethers.Contract(address, contractABI, provider);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

async function beforeEach(req, res, next) {
    if (req.method === 'POST') {
        try {
            if (await ownerContract
                .connect(await ethers.getSigner(req.body.signer))
                .authorizedUsers(req.body.signer)
            ) {
                console.log(`User ${req.body.signer} authorized`);
                next();
            } else {
                console.log(`User ${req.body.signer} is not authorized`);
                res.status(403).send('User not authorized');
            }
        } catch (error) {
            console.error("Error:", error);
            res.status(500).json({error: error});
        }
    } else {
        next();
    }
}

router.post("/createProject", async (req, res) => {
    try {
        const NewProject = await hre.ethers.getContractFactory("Project");
        const newProject = await NewProject.connect(await ethers.getSigner(req.body.signer)).deploy();
        res.json({address: newProject.address});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.get("/", async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress, true);

        res.json({
            address: await contract.address,
            projectManager: await contract.projectManager(),
            numOfAssessmentProviders: parseInt(await contract.numOfAssessmentProviders()),
            assessmentProvidersAddresses: await contract.getAssessmentProvidersAddresses(),
            administrativeAuthority: await contract.administrativeAuthority(),
            DPP: parseDocument(await contract.DPP()),
            numOfSentDPPs: parseInt(await contract.getSentDPPsLength()),
            sentDPPsAddresses: await contract.getSentDPPsAddresses(),
            numOfAssessedDPPs: parseInt(await contract.numOfAssessedDPPs()),
            DGD: parseDocument(await contract.DGD()),
            numfOfSentDGDs: parseInt(await contract.getSentDGDsLength()),
            numOfAssessedDGDs: parseInt(await contract.numOfAssessedDGDs()),
            sentDGDsAddresses: await contract.getSentDGDsAddresses(),
            buildingPermitContract: await contract.buildingPermitContract(),
            isClosed: await contract.isClosed()
        })
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post("/addAssessmentProviders", async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress);
        const addAssessmentProviders = await contract.connect(await ethers.getSigner(req.body.signer)).addAssessmentProviders(req.body.assessmentProviders);
        const receipt = await addAssessmentProviders.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post("/removeAssessmentProviders", async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress);
        const removeAssessmentProviders = await contract.connect(await ethers.getSigner(req.body.signer)).removeAssessmentProviders(req.body.assessmentProviders);
        const receipt = await removeAssessmentProviders.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post("/setAdministrativeAuthority", async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress);
        const setAdministrativeAuthority = await contract.connect(await ethers.getSigner(req.body.signer)).setAdministrativeAuthority(req.body.administrativeAuthority);
        const receipt = await setAdministrativeAuthority.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.put("/removeAdministrativeAuthority", async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress);
        const removeAdministrativeAuthority = await contract.connect(await ethers.getSigner(req.body.signer)).removeAdministrativeAuthority();
        const receipt = await removeAdministrativeAuthority.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post("/changeAdministrativeAuthority", async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress);
        const changeAdministrativeAuthority = await contract.connect(await ethers.getSigner(req.body.signer)).changeAdministrativeAuthority(req.body.administrativeAuthority);
        const receipt = await changeAdministrativeAuthority.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post("/setDPP", async (req, res) => {
    console.log(req.body);
    try {
        let contract = await getContract(req.body.contractAddress, true);
        const dpp = {
            id: JSON.parse(req.body.dpp).id,
            owner: req.body.signer,
            documentHash: getHash(JSON.parse(req.body.dpp).documentHash)
        }
        const setDPP = await contract.connect(await ethers.getSigner(req.body.signer)).setDPP(dpp);
        const receipt = await setDPP.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post("/sendDPP", async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress, true);
        let documentContractStructs = [];
        for (let i of req.body.assessmentProviders) {
            documentContractStructs.push({
                assessmentProvider: i,
                attachments: []
            });
        }

        const sendDPP = await contract.connect(await ethers.getSigner(req.body.signer)).sendDPP(documentContractStructs);
        const receipt = await sendDPP.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post("/setDGD", async (req, res) => {
    console.log(req.body);
    try {
        let contract = await getContract(req.body.contractAddress, true);
        const dgd = {
            id: JSON.parse(req.body.dgd).id,
            owner: req.body.signer,
            documentHash: getHash(JSON.parse(req.body.dgd).documentHash)
        }
        const setDGD = await contract.connect(await ethers.getSigner(req.body.signer)).setDGD(dgd);
        const receipt = await setDGD.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post("/sendDGD", async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress, true);
        let documentContractStructs = [];
        for (let i of req.body.assessmentProviders) {
            documentContractStructs.push({
                assessmentProvider: i,
                attachments: []
            });
        }

        const sendDGD = await contract.connect(await ethers.getSigner(req.body.signer)).sendDGD(documentContractStructs);
        const receipt = await sendDGD.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

module.exports = {router, initialize};


