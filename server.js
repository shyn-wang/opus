const express = require('express');

const app = express();

const PORT = 3000;

// serve frontend files
app.use(express.static('public'));

// start server
app.listen(PORT, () => {
    console.log(`server running @ http://localhost:${PORT}`);
});