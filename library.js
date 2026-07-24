// class representing each era
class era {
    constructor(elo, playlist, playlistID, numOfPlaylistTracks, probability, name) {
        this.elo = elo;
        this.playlist = playlist;
        this.playlistID = playlistID;
        this.numOfPlaylistTracks = numOfPlaylistTracks;
        this.probability = probability;
        this.name = name;
    }
}

// create objects for each era
let baroque = new era(1500, [], '15547212683', 0, 0.25, 'baroque');
let classical = new era(1500, [], '15547212643', 0, 0.25, 'classical');
let romantic = new era(1500, [], '15547212583', 0, 0.25, 'romantic');
let modern = new era(1500, [], '15547212563', 0, 0.25, 'modern');

// export objects
module.exports = {
    baroque,
    classical,
    romantic,
    modern
}