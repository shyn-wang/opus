const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000; // 3000 if running locally

const ColorThief = require('colorthief');

const path = require('path');

if (process.env.NODE_ENV === 'production') { // express only serves static files when in prod (vite serves frontend in dev)
    app.use(express.static(path.join(__dirname, 'dist')));

    app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "dist/index.html")); // open landing page on start
    });
}

// start server
app.listen(PORT, () => {
    console.log(`server running @ http://localhost:${PORT}`);
});

// api routes

app.get('/api/playlist/:id', async (req, res) => {
    try {
        const url = `https://api.deezer.com/playlist/${req.params.id}/tracks?limit=100`;

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

        // retrieve preview link & extract album cover color palette
        const preview = response.preview;

        const albumCover = response.album.cover_small;
        const palette = await ColorThief.getPalette(albumCover, 5);

        // return preview & palette to frontend
        const data = {
            'preview': preview,
            'palette': palette
        };

        res.json(data); // send response as json

    } catch (error) {
        console.log(error);
    }
});