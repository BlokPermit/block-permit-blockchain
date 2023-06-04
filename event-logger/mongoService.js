const {ServerApiVersion} = require("mongodb");
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.DATABASE_URL;

function dateFromTimestamp(timestamp) {
    return new Date(timestamp * 1000);
}

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const collections = {
    PROJECT: 'ProjectLogs',
    DOCUMENT_CONTRACT: 'DocumentContractLogs'
}

let db;

const openConnection = async () => {
    await client.connect();
    db = await client.db("blokcejn-db");
    console.log("Connected to MongoDB");
}

const closeConnection = async () => {
    await client.close();
}

const insertIntoDB = async (collectionName, eventName, contractAddress, description, timestamp) => {
    try {
        await client.connect();
        const collection = await db.collection(collectionName);

        const document = {
            eventName: eventName,
            contractAddress: contractAddress,
            description: description,
            timestamp: dateFromTimestamp(timestamp)
        }

        const result = await collection.insertOne(document);

        const colors = require('colors');
        console.log('Inserted:'.blue)
        console.log(document);
        console.log('-----------------'.yellow)
    } catch (error) {
        console.error(error);
    }
}

module.exports = {collections, insertIntoDB, openConnection, closeConnection}