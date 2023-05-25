# Docu-verification app blockchain

This is a test blockchain network for Docu-verification app.

## 1. Ganache setup
1. Download [Ganache](https://trufflesuite.com/ganache/)
2. Select "New workspace" and give it a name
3. Under Chain, set Gas price to 1. Under Accounts & Keys set Account default balance to 10000000. Leave everything else as it is.

## 2. Metamask setup
**1. Adding a network**

Click "Add network" > "Add a network manually"  Fill out the form:
- Network name: `ganachelocal`
- New RPC URL: copy the "RPC SERVER" url from ganache
- Chain ID: `1337`
- Currency symbol: `ETH`

**2. Connecting Accounts**
  1. Click on the key icon next to an account on Ganache and copy a private key
  2. In Metamask, go to "Import account" and paste the private key
  3. Under account details (three dots on the right), there is an edit icon next to account name - you can change it to f.e. "Project manager 1"

## 3. Environment setup
Create an .env file at the root of the project
```dotenv
PROVIDER_URL=`RPC SERVER url from ganache`
PRIVATE_KEY_0="Private key 0 from Ganache"
PRIVATE_KEY_1="Private key 1 from Ganache"
PRIVATE_KEY_2="..."
PRIVATE_KEY_3="..."
PRIVATE_KEY_4="..."
PRIVATE_KEY_5="..."
PRIVATE_KEY_6="..."
PRIVATE_KEY_7="..."
PRIVATE_KEY_8="..."
PRIVATE_KEY_9="..."

OWNER_CONTRACT_ADDRESS="Paste the deployed OwnerContract address if you wish to use testing api"
```

## 4. Running
All the commands should be run from root directory  

**You need to only run this command ONCE**  
`npx hardhat --network localganache run scripts/deploy.js`
This deploys a OwnerContract onto a chain. There is no need to deploy multiple instances of this contract.

**Running API server:**  
`npx hardhat --network localganache run api-testing/project.js`

**Compile contracts:**  
`npx hardhat compile`  
Note that all the other provided commands will automatically compile contracts if there have been any changes made to them.

**Running tests:**  
`npx hardhat test`  
or if you wish to run a single test script:  
`npx hardhat test test/testfilename.js`

## 5. Postman Setup


