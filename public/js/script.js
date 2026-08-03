// import files
import { eras, composers } from './library.js';
import { displayCurrentRound, displayMatchup } from './ui.js';
import { loadPlaylists } from './api.js';
import { shuffleArray, createMatchup, updateEloAndProbability } from './util.js';

// create class to store/manaage state data
export class SessionManager {
    mode;
    categories;
    onInitialMatchups;
    initialMatchupsRemaining;
    currentMatchup;
    rounds;
    settings;


    constructor() {
        this.mode = null;

        this.categories = [];

        this.onInitialMatchups = true;
        this.initialMatchupsRemaining = [];

        this.currentMatchup = {
            leftCategory: null,
            rightCategory: null,

            leftTrack: null,
            rightTrack: null
        };

        this.rounds = {
            total: 0,
            current: 0
        };

        // matchmaking algorithm settings
        this.settings = {
            probabilityDivisor: 0,
            probabilityCeil: 0,
            probabilityFloor: 0,
        };
    }


    startTest(mode) { // runs when a mode is selected
        sessionStorage.setItem('mode', mode); // save mode
        window.location.href = "/pages/stage.html";
    }


    async initializeTest() {
        this.mode = sessionStorage.getItem('mode');

        // config settings based on mode
        if (this.mode === 'eras') {
            this.categories = eras.slice();

            this.rounds.total = 15;

            this.settings.probabilityDivisor = 400;
            this.settings.probabilityCeil = 0.55;
            this.settings.probabilityFloor = 0.12;

        } else if (this.mode === 'composers') {
            this.categories = composers.slice();

            this.rounds.total = 30;

            this.settings.probabilityDivisor = 600;
            this.settings.probabilityCeil = 0.35;
            this.settings.probabilityFloor = 0.07;
        }

        // display total rounds based on mode
        displayCurrentRound(this);

        // generate order of initial matchups
        this.initialMatchupsRemaining = this.categories.slice(); // make copy of categories array so changes are not shared
        shuffleArray(this.initialMatchupsRemaining); // randomize categories -> matchup order

        // set the playlist property in each category to an array containing all the tracks in the corresponding deezer playlist
        await loadPlaylists(this);

        // process first matchup
        createMatchup(this); // -> fills currentMatchup properties
        displayMatchup(this.currentMatchup.leftTrack, this.currentMatchup.rightTrack);
    }


    processMatchupResults(winner, loser) {
        updateEloAndProbability(winner, loser, this.settings);

        // update round count
        this.rounds.current++;
        displayCurrentRound(this);
        
        // check for test completion
        if (this.rounds.current === this.rounds.total) {
            this.endTest();
            
        } else { // next round
            createMatchup(this);
            displayMatchup(this.currentMatchup.leftTrack, this.currentMatchup.rightTrack);
        }
    }


    endTest() {
        // sort categories in descending order (highest elo first)
        this.categories.sort((a, b) => b.elo - a.elo);

        // save array of categories as json
        const categoriesSerialized = JSON.stringify(this.categories);
        sessionStorage.setItem('results', categoriesSerialized);

        // save mode
        sessionStorage.setItem('mode', this.mode);

        // display results
        window.location.href = '/pages/results.html';
    }
}