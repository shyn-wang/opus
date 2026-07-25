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
let baroque = new era(1500, [], '15565783443', 0, 0.25, 'baroque');
let classical = new era(1500, [], '15565783423', 0, 0.25, 'classical');
let romantic = new era(1500, [], '15565783383', 0, 0.25, 'romantic');
let modern = new era(1500, [], '15565783343', 0, 0.25, 'modern');

// export objects
module.exports = {
    baroque,
    classical,
    romantic,
    modern
}