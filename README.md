# Docu-verification app blockchain

This is a test blockchain network for Docu-verification app.

## 1. Running
All the commands should be run from root directory  
**1. Run Ganache**  
`npm run ganache`  
This command will always create the same keys, but I still have to find a way to persist data on a blockchain.

**2. Deploy OwnerContract**  
`npx hardhat --network localganache run scripts/deploy.js`

**3. Run API server:**  
`npx hardhat --network localganache run api/server.js`

**Compile contracts:**  
`npx hardhat compile`  
Note that all the other provided commands will automatically compile contracts if there have been any changes made to them.

**Running tests:**  
`npx hardhat test`  
or if you wish to run a single test script:  
`npx hardhat test test/testfilename.js`

**Running logger:**  
`npm run eventLogger`

## 2. Postman variables setup
Always change "Current value" if you need to. You should never need to change users' and OwnerContract's addresses if setup has been done correctly.

## 3. Metamask setup
**1. Adding a network**

Click "Add network" > "Add a network manually"  Fill out the form:
- Network name: `ganachelocal`
- New RPC URL: `127.0.0.1:8545` (should be, else copy it from console)
- Chain ID: `1337`
- Currency symbol: `ETH`

**2. Connecting Accounts**
1. In Metamask, go to "Import account" and paste the private key
2. Under account details (three dots on the right), there is an edit icon next to account name - you can change it to f.e. "Project manager 1"

