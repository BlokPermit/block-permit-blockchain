require("dotenv").config();
const express = require("express");
const hre = require("hardhat");
const router = express();
const {getOwnerContract} = require("../utils");

let contract;

async function initialize() {
    contract = await getOwnerContract();
}

router.use(express.urlencoded({extended: true}));

router.post("/addOwners", async (req, res) => {
    try {
        const addOwners = await contract
            .connect(await ethers.getSigner(req.body.signer))
            .addOwners(req.body.owners);
        const receipt = await addOwners.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post("/removeOwners", async (req, res) => {
    try {
        const removeOwners = await contract
            .connect(await ethers.getSigner(req.body.signer))
            .removeOwners(req.body.owners);
        const receipt = await removeOwners.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post("/authorizeUsers", async (req, res) => {
    try {
        const authorizeUsers = await contract
            .connect(await ethers.getSigner(req.body.signer))
            .authorizeUsers(req.body.users);
        const receipt = await authorizeUsers.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post("/unauthorizeUsers", async (req, res) => {
    try {
        const unauthorizeUsers = await contract
            .connect(await ethers.getSigner(req.body.signer))
            .unauthorizeUsers(req.body.users);
        const receipt = await unauthorizeUsers.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.get("/isOwner", async (req, res) => {
    try {
        const isOwner = await contract
            .connect(await ethers.getSigner())
            .owners(req.body.owner);
        res.json({value: isOwner});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.get("/isAuthorizedUser", async (req, res) => {
    try {
        const isUser = await contract
            .connect(await ethers.getSigner())
            .authorizedUsers(req.body.user);
        res.json({value: isUser});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

module.exports = {router, initialize};
