const Web3 = require('web3');
const {collections, insertIntoDB} = require('./mongoService.js');

const provider = new Web3.providers.WebsocketProvider('ws://127.0.0.1:8545');
const web3 = new Web3(provider);

const projectCreatedHash = web3.utils.keccak256("ProjectCreated(uint256)");
const assessmentProviderAddedHash = web3.utils.keccak256("AssessmentProviderAdded(address,uint256)");
const assessmentProviderRemovedHash = web3.utils.keccak256("AssessmentProviderRemoved(address,uint256)");
const administrativeAuthoritySetHash = web3.utils.keccak256("AdministrativeAuthoritySet(address,uint256)");
const administrativeAuthorityRemovedHash = web3.utils.keccak256("AdministrativeAuthorityRemoved(address,uint256)");
const DPPSetHash = web3.utils.keccak256("DPPset(string,uint256)");
const DPPSentHash = web3.utils.keccak256("DPPsent(address,uint256)");
const allDPPsAssessedHash = web3.utils.keccak256("allDPPsAssessed(uint256)");
const DGDSetHash = web3.utils.keccak256("DGDset(string,uint256)");
const DGDSentHash = web3.utils.keccak256("DGDsent(address,uint256)");
const allDGDsAssessedHash = web3.utils.keccak256("allDGDsAssessed(uint256)");
const BuildingPermitContractCreatedHash = web3.utils.keccak256("BuildingPermitContractCreated(address,uint256)");

const collection = collections.PROJECT;

function dateFromTimestamp(timestamp) {
    return new Date(timestamp * 1000);
}

const projectCreated = async (event) => {
    const parameterTypes = ['uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const timestamp = decodedParameters[0];
    const description = "Projekt ustvarjen"
    await insertIntoDB(collection, "ProjectCreated", event.address, description, timestamp);
}

const assessmentProviderAdded = async (event) => {
    const parameterTypes = ['address', 'uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const address = decodedParameters[0];
    const timestamp = decodedParameters[1];
    const description = `Mnenjedajalec ${address} dodan na projekt`;
    await insertIntoDB(collection, "AssessmentProviderAdded", event.address, description, timestamp);
}

const assessmentProviderRemoved = async (event) => {
    const parameterTypes = ['address', 'uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const address = decodedParameters[0];
    const timestamp = decodedParameters[1];
    const description = `Mnenjedajalec ${address} odstranjen iz projekta`;
    await insertIntoDB(collection, "AssessmentProviderRemoved", event.address, description, timestamp);
}

const administrativeAuthoritySet = async (event) => {
    const parameterTypes = ['address', 'uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const address = decodedParameters[0];
    const timestamp = decodedParameters[1];
    const description = `Upravni organ ${address} dodan na projekt`;
    await insertIntoDB(collection, "AdministrativeAuthoritySet", event.address, description, timestamp);
}

const administrativeAuthorityRemoved = async (event) => {
    const parameterTypes = ['address', 'uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const address = decodedParameters[0];
    const timestamp = decodedParameters[1];
    const description = `Upravni organ ${address} odstranjen iz projekta`;
    await insertIntoDB(collection, "AdministrativeAuthorityRemoved", event.address, description, timestamp);
}

const DPPSet = async (event) => {
    const parameterTypes = ['string', 'uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const documentId = decodedParameters[0];
    const timestamp = decodedParameters[1];
    const description = `DPP z urljem ${documentId} dodan na projekt`;
    await insertIntoDB(collection, "DPPSet", event.address, description, timestamp);
}

const DPPSent = async (event) => {
    const parameterTypes = ['address', 'uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const address = decodedParameters[0];
    const timestamp = decodedParameters[1];
    const description = `DPP ${address} poslan mnenjedajalcu`;
    await insertIntoDB(collection, "DPPSent", event.address, description, timestamp);
}

const allDPPsAssessed = async (event) => {
    const parameterTypes = ['uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const timestamp = decodedParameters[0];
    const description = `Pridobljeni vsi projektni pogoji`;
    await insertIntoDB(collection, "allDPPsAssessed", event.address, description, timestamp);
}

const DGDSet = async (event) => {
    const parameterTypes = ['string', 'uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const documentId = decodedParameters[0];
    const timestamp = decodedParameters[1];
    const description = `DGD z urljem ${documentId} dodan na projekt`;
    await insertIntoDB(collection, "DGDSet", event.address, description, timestamp);
}

const DGDSent = async (event) => {
    const parameterTypes = ['address', 'uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const address = decodedParameters[0];
    const timestamp = decodedParameters[1];
    const description = `DGD ${address} poslan mnenjedajalcu`;
    await insertIntoDB(collection, "DGDSent", event.address, description, timestamp);
}

const allDGDsAssessed = async (event) => {
    const parameterTypes = ['uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const timestamp = decodedParameters[0];
    const description = `Pridobljena vsa projektna mnenja`;
    await insertIntoDB(collection, "AllDGDsAssessed", event.address, description, timestamp);
}

const buildingPermitContractCreated = async (event) => {
    const parameterTypes = ['address', 'uint256'];
    const decodedParameters = web3.eth.abi.decodeParameters(parameterTypes, event.data);
    const address = decodedParameters[0];
    const timestamp = decodedParameters[1];
    const description = `Poslana vloga za pridobitev gradbenega dovoljenja ${address}`;
    await insertIntoDB(collection, "BuildingPermitContractCreated", event.address, description, timestamp);
}

const topics = {
    projectCreatedHash,
    assessmentProviderAddedHash,
    assessmentProviderRemovedHash,
    administrativeAuthoritySetHash,
    administrativeAuthorityRemovedHash,
    DPPSetHash,
    DPPSentHash,
    allDPPsAssessedHash,
    DGDSetHash,
    DGDSentHash,
    allDGDsAssessedHash,
    BuildingPermitContractCreatedHash,
};

const functions = {
    projectCreated,
    assessmentProviderAdded,
    assessmentProviderRemoved,
    administrativeAuthoritySet,
    administrativeAuthorityRemoved,
    DPPSet,
    DPPSent,
    allDPPsAssessed,
    DGDSet,
    DGDSent,
    allDGDsAssessed,
    buildingPermitContractCreated
};

const project = {
    topics,
    functions
}


module.exports = {project};
