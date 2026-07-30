// class representing a composer/era
class category {
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
const baroque = new category(1500, [], '15565783443', 0, 0.25, 'baroque');
const classical = new category(1500, [], '15565783423', 0, 0.25, 'classical');
const romantic = new category(1500, [], '15565783383', 0, 0.25, 'romantic');
const modern = new category(1500, [], '15565783343', 0, 0.25, 'modern');

// create objects for each composer
const bach = new category(1500, [], '15568732003', 0, 0.125, 'bach');
const mozart = new category(1500, [], '15568731923', 0, 0.125, 'mozart');
const beethoven = new category(1500, [], '15568731863', 0, 0.125, 'beethoven');
const chopin = new category(1500, [], '15568731843', 0, 0.125, 'chopin');
const liszt = new category(1500, [], '15568731783', 0, 0.125, 'liszt');
const rachmaninoff = new category(1500, [], '15568731743', 0, 0.125, 'rachmaninoff');
const scriabin = new category(1500, [], '15568731703', 0, 0.125, 'scriabin');
const debussy = new category(1500, [], '15568731663', 0, 0.125, 'debussy');

// export objects
module.exports = {
    baroque,
    classical,
    romantic,
    modern,
    bach,
    mozart,
    beethoven,
    chopin,
    liszt,
    rachmaninoff,
    scriabin,
    debussy
}