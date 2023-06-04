const Web3 = require('web3');
const {collections, insertIntoDB} = require('./mongoService.js');

const provider = new Web3.providers.WebsocketProvider('ws://127.0.0.1:8545');
const web3 = new Web3(provider);

const documentContractCreatedHash = web3.utils.keccak256("DocumentContractCreated(uint256)");
const attachmentAddedHash = web3.utils.keccak256("AttachmentAdded(string,uint256)");
const attachmentRemovedHash = web3.utils.keccak256("AttachmentRemoved(string,uint256)");
const mainDocumentUpdateRequestedHash = web3.utils.keccak256("MainDocumentUpdateRequested(uint256)");
const assessmentDueDateExtensionRequestedHash = web3.utils.keccak256("AssessmentDueDateExtensionRequested(uint256,uint256)");
const assessmentDueDateExtensionEvaluatedHash = web3.utils.keccak256("AssessmentDueDateExtensionEvaluated(bool,uint256)");
const assessmentProvidedHash = web3.utils.keccak256("AssessmentProvided(string,uint256)");
const assessmentAttachmentAddedHash = web3.utils.keccak256("AssessmentAttachmentAdded(string,uint256)");
const assessmentAttachmentRemovedHash = web3.utils.keccak256("AssessmentAttachmentRemoved(string,uint256)");
const assessmentMainDocumentUpdatedHash = web3.utils.keccak256("AssessmentMainDocumentUpdated(string,uint256)");
const deadlineExceededHash = web3.utils.keccak256("DeadlineExceeded(uint256)");

function dateFromTimestamp(timestamp) {
    return new Date(timestamp * 1000).toLocaleString('en-GB', { timeZone: 'CET' });
}

const collection = collections.DOCUMENT_CONTRACT;

const documentContractCreated = async (event) => {
    const parameterTypes = ['uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const timestamp = decodedParameters[0];
    const description = `Dokumentna pogodba ustvarjena`
    await insertIntoDB(collection, "DocumentContractCreated", event.address, description, timestamp);
}

const attachmentAdded = async (event) => {
    const parameterTypes = ['string', 'uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const documentId = decodedParameters[0];
    const timestamp = decodedParameters[1];
    const description = `Priloga z URL-jem ${documentId} dodana na vlogo`
    await insertIntoDB(collection, "AttachmentAdded", event.address, description, timestamp);
}

const attachmentRemoved = async (event) => {
    const parameterTypes = ['string', 'uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const documentId = decodedParameters[0];
    const timestamp = decodedParameters[1];
    const description = `Priloga z URL-jem ${documentId} odstranjena na vlogo`
    await insertIntoDB(collection, "AttachmentRemoved", event.address, description, timestamp);
}

const mainDocumentUpdateRequested = async (event) => {
    const parameterTypes = ['uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const timestamp = decodedParameters[0];
    const description = `Podana zahteva za popravek glavnega dokumenta`
    await insertIntoDB(collection, "MainDocumentUpdateRequested", event.address, description, timestamp);
}

const assessmentDueDateExtensionRequested = async (event) => {
    const parameterTypes = ['uint256', 'uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const requestedDueDate = decodedParameters[0];
    const timestamp = decodedParameters[1];
    const description = `Podana zahteva za podaljšanje roka do ${dateFromTimestamp(requestedDueDate)}`
    await insertIntoDB(collection, "MainDocumentUpdateRequested", event.address, description, timestamp);
}

const assessmentDueDateExtensionEvaluated = async (event) => {
    const parameterTypes = ['bool', 'uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const requestConfirmed = decodedParameters[0];
    const timestamp = decodedParameters[1];
    const description = `Zahteva za podljšanje roka ${requestConfirmed ? 'sprejeta' : 'zavrnjena'}`
    await insertIntoDB(collection, "AssessmentDueDateExtensionEvaluated", event.address, description, timestamp);
}

const assessmentProvided = async (event) => {
    const parameterTypes = ['string', 'uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const documentId = decodedParameters[0];
    const timestamp = decodedParameters[1];
    const description = `Mnenje podano z dokumentom z URL-jem ${documentId}`;
    await insertIntoDB(collection, "AssessmentProvided", event.address, description, timestamp);
}

const assessmentAttachmentAdded = async (event) => {
    const parameterTypes = ['string', 'uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const documentId = decodedParameters[0];
    const timestamp = decodedParameters[1];
    const description = `Priloga z URL-jem ${documentId} dodana na mnenje`;
    await insertIntoDB(collection, "AssessmentAttachmentAdded", event.address, description, timestamp);
}

const assessmentAttachmentRemoved = async (event) => {
    const parameterTypes = ['string', 'uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const documentId = decodedParameters[0];
    const timestamp = decodedParameters[1];
    const description = `Priloga z URL-jem ${documentId} odstranjena iz mnenja`;
    await insertIntoDB(collection, "AssessmentAttachmentRemoved", event.address, description, timestamp);
}

const assessmentMainDocumentUpdated = async (event) => {
    const parameterTypes = ['string', 'uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const documentId = decodedParameters[0];
    const timestamp = decodedParameters[1];
    const description = `Glavni dokument z URL-jem ${documentId} posodobljen`;
    await insertIntoDB(collection, "AssessmentMainDocumentUpdated", event.address, description, timestamp);
}

const deadlineExceeded = async (event) => {
    const parameterTypes = ['uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const timestamp = decodedParameters[0];
    const description = `Rok za mnenja potečen`;
    await insertIntoDB(collection, "DeadlineExceeded", event.address, description, timestamp);
}

const topics = {
    documentContractCreatedHash,
    attachmentAddedHash,
    attachmentRemovedHash,
    mainDocumentUpdateRequestedHash,
    assessmentDueDateExtensionRequestedHash,
    assessmentDueDateExtensionEvaluatedHash,
    assessmentProvidedHash,
    assessmentAttachmentAddedHash,
    assessmentAttachmentRemovedHash,
    assessmentMainDocumentUpdatedHash,
    deadlineExceededHash
};

const functions = {
    documentContractCreated,
    attachmentAdded,
    attachmentRemoved,
    mainDocumentUpdateRequested,
    assessmentDueDateExtensionRequested,
    assessmentDueDateExtensionEvaluated,
    assessmentProvided,
    assessmentAttachmentAdded,
    assessmentAttachmentRemoved,
    assessmentMainDocumentUpdated,
    deadlineExceeded
};

const documentContract = {
    topics,
    functions
}
module.exports = {documentContract}