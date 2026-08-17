import type { DeezerTrack } from "./types";

// class representing a single composer/era (category)
export class Category {
    name: string;
    elo: number;
    playlist: DeezerTrack[];
    playlistId: string;
    probability: number;

    constructor(name: string, playlistId: string, probability: number) {
        this.name = name;
        this.elo = 1500; // base rating

        this.playlist = [];
        this.playlistId = playlistId; // deezer id

        this.probability = probability;
    }

    getRandomTrack(): DeezerTrack {
        const selectedIndex = Math.floor((Math.random() * (this.playlist.length)));
        const selectedTrack = this.playlist[selectedIndex];

        // remove selected track from playlist
        this.playlist.splice(selectedIndex, 1);

        return selectedTrack;
    }
}

// create objects for each era
const baroque = new Category('Baroque', '15565783443', 0.25);
const classical = new Category('Classical', '15565783423', 0.25);
const romantic = new Category('Romantic', '15565783383', 0.25);
const modern = new Category('Modern', '15565783343', 0.25);

// create objects for each composer
const bach = new Category('Johann Sebastian Bach', '15568732003', 0.125);
const mozart = new Category('Wolfgang Amadeus Mozart', '15568731923', 0.125);
const beethoven = new Category('Ludwig van Beethoven', '15568731863', 0.125);
const chopin = new Category('Frédéric Chopin', '15568731843', 0.125);
const liszt = new Category('Franz Liszt', '15568731783', 0.125);
const rachmaninoff = new Category('Sergei Rachmaninoff', '15568731743', 0.125);
const scriabin = new Category('Alexander Scriabin', '15568731703', 0.125);
const debussy = new Category('Claude Debussy', '15568731663', 0.125);

// group eras
export const eras = [
    baroque,
    classical,
    romantic,
    modern
];

// group composers
export const composers = [
    bach,
    mozart,
    beethoven,
    chopin,
    liszt,
    rachmaninoff,
    scriabin,
    debussy
];