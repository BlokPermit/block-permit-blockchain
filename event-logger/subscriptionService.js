const Web3 = require('web3');
const {closeConnection} = require("./mongoService");
const {openConnection} = require("./mongoService");

const {project} = require("./ProjectEvents.js");
const {documentContract} = require("./DocumentContractEvents.js")
// Connect to the Ethereum network
const provider = new Web3.providers.WebsocketProvider('ws://127.0.0.1:8545');
const web3 = new Web3(provider);

//This one reads and stores all events from the creation of a blockchain. Be sure to delete the database before running with these options
/*let options = {
    fromBlock: 0,
};*/

let options = {
    fromBlock: 'latest',
};

let connectedToMongo = false;

let subscription = web3.eth.subscribe('logs', options,async (err,event) => {
    if (!connectedToMongo) {
        await openConnection();
        connectedToMongo = true;
    }
    if (!err) {
        switch (event.topics[0]) {
            case project.topics.projectCreatedHash:
                await project.functions.projectCreated(event);
                break;
            case project.topics.assessmentProviderAddedHash:
                await project.functions.assessmentProviderAdded(event);
                break;
            case project.topics.assessmentProviderRemovedHash:
                await project.functions.assessmentProviderRemoved(event);
                break;
            case project.topics.administrativeAuthoritySetHash:
                await project.functions.administrativeAuthoritySet(event);
                break;
            case project.topics.administrativeAuthorityRemovedHash:
                await project.functions.administrativeAuthorityRemoved(event);
                break;
            case project.topics.DPPSetHash:
                await project.functions.DPPSet(event);
                break;
            case project.topics.DPPSentHash:
                await project.functions.DPPSent(event);
                break;
            case project.topics.allDPPsAssessedHash:
                await project.functions.allDPPsAssessed(event);
                break;
            case project.topics.DGDSetHash:
                await project.functions.DGDSet(event);
                break;
            case project.topics.DGDSentHash:
                await project.functions.DGDSent(event);
                break;
            case project.topics.allDGDsAssessedHash:
                await project.functions.allDGDsAssessed(event);
                break;
            case project.topics.BuildingPermitContractCreatedHash:
                await project.functions.buildingPermitContractCreated(event);
                break;
            case documentContract.topics.documentContractCreatedHash:
                await documentContract.functions.documentContractCreated(event);
                break;
            case documentContract.topics.attachmentAddedHash:
                await documentContract.functions.attachmentAdded(event);
                break;
            case documentContract.topics.attachmentRemovedHash:
                await documentContract.functions.attachmentRemoved(event);
                break;
            case documentContract.topics.mainDocumentUpdateRequestedHash:
                await documentContract.functions.mainDocumentUpdateRequested(event);
                break;
            case documentContract.topics.assessmentDueDateExtensionRequestedHash:
                await documentContract.functions.assessmentDueDateExtensionRequested(event);
                break;
            case documentContract.topics.assessmentDueDateExtensionEvaluatedHash:
                await documentContract.functions.assessmentDueDateExtensionEvaluated(event);
                break;
            case documentContract.topics.assessmentProvidedHash:
                await documentContract.functions.assessmentProvided(event);
                break;
            case documentContract.topics.assessmentAttachmentAddedHash:
                await documentContract.functions.assessmentAttachmentAdded(event);
                break;
            case documentContract.topics.assessmentAttachmentRemovedHash:
                await documentContract.functions.assessmentAttachmentRemoved(event);
                break;
            case documentContract.topics.assessmentMainDocumentUpdatedHash:
                await documentContract.functions.assessmentMainDocumentUpdated(event);
                break;
            case documentContract.topics.deadlineExceededHash:
                await documentContract.functions.deadlineExceeded(event);
                break;
            default:
                const colors = require('colors');
                console.log("Not matching!".bgRed);
        }
    } else {
        console.error(err);
    }
});

subscription.on('data', event => console.log(event));
subscription.on('changed', changed => console.log(changed))
subscription.on('error', err => { throw err })
subscription.on('connected', async nr => {
    const colors = require('colors');
    console.log(`Subscription with id ${nr} started`.underline.green);
});

process.on('SIGINT', async () => {
    await closeConnection();
    process.exit();
});