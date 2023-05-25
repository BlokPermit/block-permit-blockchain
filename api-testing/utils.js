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

module.exports = {getContractABI, getOwnerContract};