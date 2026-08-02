export async function loadPlaylists(testManager) {
    for (const category of testManager.categories) {
        const url = `/api/playlist/${category.playlistId}`;

        try {
            const response = await (await fetch(url)).json();
            category.playlist = response.data; // 'response.data' returns array of tracks

            console.log(category);

        } catch (error) {
            console.error(error);
        }
    }
}

export async function loadTrackInfo(trackInfo) {
    const leftTrackURL = `/api/track/${trackInfo.leftTrack.id}`;
    const rightTrackURL = `/api/track/${trackInfo.rightTrack.id}`;

    try {
        const responseLeft = await (await fetch(leftTrackURL)).json();
        const responseRight = await (await fetch(rightTrackURL)).json();

        console.log(responseLeft);
        console.log(responseRight);

        trackInfo.leftTrack.preview = responseLeft.preview; // update links
        trackInfo.rightTrack.preview = responseRight.preview;

        trackInfo.paletteLeft = responseLeft.palette;
        trackInfo.paletteRight = responseRight.palette;

    } catch (error) {
        console.error(error);
    }
}