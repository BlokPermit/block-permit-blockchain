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

router.post("/addOwner", async (req, res) => {
    try {
        const addOwner = await contract
            .connect(await ethers.getSigner(req.body.signer))
            .addOwner(req.body.owner);
        const receipt = await addOwner.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post("/removeOwner", async (req, res) => {
    try {
        const removeOwner = await contract
            .connect(await ethers.getSigner(req.body.signer))
            .removeOwner(req.body.owner);
        const receipt = await removeOwner.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post("/authorizeUser", async (req, res) => {
    try {
        const authorizeUser = await contract
            .connect(await ethers.getSigner(req.body.signer))
            .authorizeUser(req.body.user);
        const receipt = await authorizeUser.wait();
        res.json({transactionHash: receipt.transactionHash});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({error: error});
    }
});

router.post("/unauthorizeUser", async (req, res) => {
    try {
        const unauthorizeUser = await contract
            .connect(await ethers.getSigner(req.body.signer))
            .unauthorizeUser(req.body.user);
        const receipt = await unauthorizeUser.wait();
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
/*router.listen(3001, async () => {
  console.log("OwnerContract API is running on port 3001");
  const contractABI = await getContractABI("OwnerContract");
  const provider = ethers.getDefaultProvider();
  contract = new ethers.Contract(
    process.env.OWNER_CONTRACT_ADDRESS,
    contractABI,
    provider
  );
});*/
