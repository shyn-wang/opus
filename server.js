const e = require('express');
const express = require('express');

const app = express();

const PORT = 3000;

// serve frontend files
app.use(express.static('public'));

// start server
app.listen(PORT, () => {
    console.log(`server running @ http://localhost:${PORT}`);
});

// create routes

app.get('/api/playlist/:id', async (req, res) => {
    try {
        const url = `https://api.deezer.com/playlist/${req.params.id}/tracks`;

        const response = await (await fetch(url)).json();
        res.send(response);

    } catch (error) {
        console.log(error);
    }
});

app.get('/api/track/:id', async (req, res) => {
    try {
        const url = `https://api.deezer.com/track/${req.params.id}`;

        const response = await (await fetch(url)).json();
        res.send(response);

    } catch (error) {
        console.log(error);
    }
});