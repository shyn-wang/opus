export async function loadPlaylists(sessionManager) {
    await Promise.all( // use promise.all to run fetch requests in parallel
        sessionManager.categories.map(async (category) => { // use map to create an array of promises from the categories array (async function called on each category object creates a promise)
            const url = `/api/playlist/${category.playlistId}`;

            try {
                const response = await (await fetch(url)).json();
                category.playlist = response.data; // 'response.data' returns array of tracks

                console.log(category);

            } catch (error) {
                console.error(error);
            }
        })
    );
}

// called immediately prior to displaying a matchup
export async function loadPaletteAndPreview(trackData) {
    const leftTrackURL = `/api/track/${trackData.leftTrack.id}`;
    const rightTrackURL = `/api/track/${trackData.rightTrack.id}`;

    try {
        const [responseLeft, responseRight] = await Promise.all([
            fetch(leftTrackURL).then(res => res.json()),
            fetch(rightTrackURL).then(res => res.json())
        ]);

        trackData.leftTrack.preview = responseLeft.preview; // update preview links
        trackData.rightTrack.preview = responseRight.preview;

        trackData.paletteLeft = responseLeft.palette; // set palette data
        trackData.paletteRight = responseRight.palette;

    } catch (error) {
        console.log(error);
    }
}