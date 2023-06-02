const fs = require('fs');
const path = require('path');
const hre = require("hardhat");

async function getContractABI(contractName) {
    const artifactsPath = path.join(__dirname, "..", "artifacts", "contracts");
    const artifactFile = `${artifactsPath}/${contractName}.sol/${contractName}.json`;

    const artifactData = fs.readFileSync(artifactFile, "utf8");
    const {abi} = JSON.parse(artifactData);

    return abi;
}

async function getOwnerContract() {
    const contractABI = await getContractABI("OwnerContract");
    const provider = ethers.getDefaultProvider();
    return new ethers.Contract(
        process.env.OWNER_CONTRACT_ADDRESS,
        contractABI,
        provider
    );
}

function addDaysToCurrentDate(days) {
    const EPOCH_DAY = 86400;
    return Math.floor(new Date().getTime() / 1000 + days * EPOCH_DAY);
}

function parseDocument(document) {
    return {
        id: document.id,
        owner: document.owner,
        documentHash: document.documentHash
    }
}

function getDateFromEpoch(epochDate) {
    return new Date(epochDate * 1000);
}

function getHash(hash) {
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(hash));
}

module.exports = {
    getContractABI,
    getOwnerContract,
    addDaysToCurrentDate,
    getDateFromEpoch,
    parseDocument,
    getHash
};