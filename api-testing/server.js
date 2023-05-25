const express = require('express');
const app = express();

// Import route files
const ownerContractRoute = require('./routes/ownerContract');
const projectRoute = require('./routes/project');

// Use route files
app.use('/ownerContract', ownerContractRoute.router);
app.use('/project', projectRoute.router);

// Start the server
const port = 3000; // Specify the desired port
app.listen(port, async ()  => {
    await ownerContractRoute.initialize();
    await projectRoute.initialize();
    console.log(`Server is running on port ${port}`);
});