require("dotenv").config();
const express = require("express");
const hre = require("hardhat");
const router = express();
const {
    getContractABI,
    getOwnerContract,
    addDaysToCurrentDate,
    getDateFromEpoch,
    parseDocument,
    getHash
} = require("../utils");

var ownerContract;
var contractABI;
const provider = ethers.getDefaultProvider();

router.use(express.urlencoded({extended: true}), beforeEach);

async function initialize() {
    contractABI = await getContractABI("DocumentContract");
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

async function getProject(address) {
    try {
        return new ethers.Contract(address, await getContractABI("Project"), await ethers.getSigner());
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

function parseAttachments(_attachments) {
    let attachments = [];
    for (let i of _attachments) {
        attachments.push(parseDocument(i));
    }
    return attachments;
}

async function parseAssessment(assessment, contract) {
    let assessmentAttachments = [];
    if (assessment.assessmentAttachments !== undefined) {
        for (let i in assessment.assessmentAttachments) {
            assessmentAttachments.push(parseDocument(i));
        }
    }
    return {
        dateProvided: getDateFromEpoch(parseInt(assessment.dateProvided)),
        assessmentMainDocument: assessment.assessmentMainDocument !== undefined ? parseDocument(assessment.assessmentMainDocument) : '',
        assessmentAttachments: parseAttachments(await contract.getAssessmentAttachments())
    }
}

router.get('/', async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress, true);

        res.json({
            address: await contract.address,
            project: await contract.project(),
            projectManager: await contract.projectManager(),
            assessmentProvider: await contract.assessmentProvider(),
            attachments: parseAttachments(await contract.getAttachments()),
            attachmentsLength: parseInt(await contract.getAttachmentsLength()),
            mainDocumentType: await contract.mainDocumentType(),
            mainDocumentUpdateRequested: await contract.mainDocumentUpdateRequested(),
            dateCreated: getDateFromEpoch(parseInt(await contract.dateCreated())),
            assessmentDueDate: getDateFromEpoch(parseInt(await contract.assessmentDueDate())),
            requestedAssessmentDueDate: getDateFromEpoch(parseInt(await contract.requestedAssessmentDueDate())),
            assessment: await parseAssessment(await contract.assessment(), contract),
            assessmentAttachmentsLenght: parseInt(await contract.getAssessmentAttachmentsLength()),
            isClosed: await contract.isClosed()
        })
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post('/addAttachments', async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress, true);

        let attachments = [];
        for (let i of req.body.attachments) {
            let attachment = JSON.parse(i);
            attachments.push({
                id: attachment.id,
                owner: req.body.signer,
                documentHash: getHash(attachment.documentHash)
            });
        }
        const addAttachments = await contract.connect(await ethers.getSigner(req.body.signer)).addAttachments(attachments);
        const receipt = await addAttachments.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post('/removeAttachments', async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress, true);

        const removeAttachments = await contract.connect(await ethers.getSigner(req.body.signer)).removeAttachments(req.body.attachmentsIds);
        const receipt = await removeAttachments.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post('/requestMainDocumentUpdate', async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress, true);

        const requestMainDocumentUpdate = await contract.connect(await ethers.getSigner(req.body.signer)).requestMainDocumentUpdate();
        const receipt = await requestMainDocumentUpdate.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post('/requestAssessmentDueDateExtension', async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress, true);

        const requestAssessmentDueDateExtension = await contract.connect(await ethers.getSigner(req.body.signer))
            .requestAssessmentDueDateExtension(Math.floor(Date.parse(req.body.extendedAssessmentDueDate) / 1000));
        const receipt = await requestAssessmentDueDateExtension.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post('/evaluateAssessmentDueDateExtension', async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress, true);

        const evaluateAssessmentDueDateExtension = await contract.connect(await ethers.getSigner(req.body.signer))
            .evaluateAssessmentDueDateExtension(req.body.confirm === "true");
        const receipt = await evaluateAssessmentDueDateExtension.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post('/provideAssessment', async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress, true);

        let attachments = [];
        for (let i of req.body.assessmentAttachments) {
            let attachment = JSON.parse(i);
            attachments.push({
                id: attachment.id,
                owner: req.body.signer,
                documentHash: getHash(attachment.documentHash)
            });
        }

        const assessment = {
            dateProvided: 0,
            assessmentMainDocument: {
                id: JSON.parse(req.body.assessmentMainDocument).id,
                owner: req.body.signer,
                documentHash: getHash(JSON.parse(req.body.assessmentMainDocument).documentHash)
            },
            assessmentAttachments: attachments
        }

        const provideAssessment = await contract.connect(await ethers.getSigner(req.body.signer))
            .provideAssessment(assessment, req.body.requiresAssessment === "true");
        const receipt = await provideAssessment.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post('/addAssessmentAttachments', async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress, true);

        let attachments = [];
        for (let i of req.body.assessmentAttachments) {
            let attachment = JSON.parse(i);
            attachments.push({
                id: attachment.id,
                owner: req.body.signer,
                documentHash: getHash(attachment.documentHash)
            });
        }

        const addAssessmentAttachments = await contract.connect(await ethers.getSigner(req.body.signer))
            .addAssessmentAttachments(attachments);
        const receipt = await addAssessmentAttachments.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post('/removeAssessmentAttachments', async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress, true);

        const removeAssessmentAttachments = await contract.connect(await ethers.getSigner(req.body.signer))
            .removeAssessmentAttachments(req.body.assessmentAttachmentsIds);
        const receipt = await removeAssessmentAttachments.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post('/updateAssessmentMainDocument', async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress, true);

        const assessmentMainDocument = {
            id: JSON.parse(req.body.assessmentMainDocument).id,
            owner: req.body.signer,
            documentHash: getHash(JSON.parse(req.body.assessmentMainDocument).documentHash)
        };
        const updateAssessmentMainDocument = await contract.connect(await ethers.getSigner(req.body.signer))
            .updateAssessmentMainDocument(assessmentMainDocument);
        const receipt = await updateAssessmentMainDocument.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.get('/isDeadlineExceeded', async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress, true);
        const isDeadlineExceeded = await contract.isDeadlineExceeded();
        res.json({isDeadlineExceeded: isDeadlineExceeded});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.get('/getAttachmentById', async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress, true);
        const attachment = await contract.getAttachmentById(req.body.id);
        res.json(parseDocument(attachment));
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.get('/getAssessmentAttachmentById', async (req, res) => {
    try {
        let contract = await getContract(req.body.contractAddress, true);
        const assessmentAttachment = await contract.getAssessmentAttachmentById(req.body.id);
        res.json(parseDocument(assessmentAttachment));
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

module.exports = {router, initialize};



