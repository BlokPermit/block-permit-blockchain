const express = require('express');
const app = express();

// Import route files
const ownerContractRoute = require('./routes/ownerContract');
const projectRoute = require('./routes/project');
const documentContractRoute = require('./routes/documentContract');

// Use route files
app.use('/ownerContract', ownerContractRoute.router);
app.use('/project', projectRoute.router);
app.use('/documentContract', documentContractRoute.router);

// Start the server
const port = process.env.BACKEND_PORT; // Specify the desired port
app.listen(port, async ()  => {
    await ownerContractRoute.initialize();
    await projectRoute.initialize();
    await documentContractRoute.initialize();
    console.log(`Server is running on port ${port}`);
});