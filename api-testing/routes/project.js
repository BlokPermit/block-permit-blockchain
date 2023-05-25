require("dotenv").config();
const express = require("express");
const hre = require("hardhat");
const router = express();
const {getContractABI, getOwnerContract} = require("../utils");

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
        let project = await getContract(req.body.contractAddress, true);
        res.json({
            projectManager: await project.projectManager(),
            numOfAssessmentProviders: parseInt(await project.numOfAssessmentProviders()),
            administrativeAuthority: await project.administrativeAuthority(),
            numOfSentDPPs: parseInt(await project.getSentDPPsLength()),
            numOfAssessedDPPs: parseInt(await project.numOfAssessedDPPs()),
            numfOdSentDGDs: parseInt(await project.getSentDGDsLength()),
            buildingPermitContract: await project.buildingPermitContract(),
            isClosed: await project.isClosed()
        })
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post("/addAssessmentProviders", async (req, res) => {
    try {
        let project = await getContract(req.body.contractAddress);
        const addAssessmentProviders = await project.connect(await ethers.getSigner(req.body.signer)).addAssessmentProviders(req.body.assessmentProviders);
        const receipt = await addAssessmentProviders.wait();
        res.json({ transactionHash: receipt.transactionHash });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

module.exports = {router, initialize};

/*router.listen(3002, async () => {
  console.log("Project API is running on port 3002");
  const contractABI = await getContractABI("Project");
  const provider = ethers.getDefaultProvider();
  ownerContract = await getOwnerContract();
});*/


