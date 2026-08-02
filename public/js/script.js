// import files
import { eras, composers } from './library.js';
import { modeSelector, displayCurrentRound, displayTracks, displayResults } from './ui.js';
import { loadPlaylists } from './api.js';

const testManager = {
    mode: null,

    categories: [],

    onInitialMatchups: true,
    initialMatchupsRemaining: [],

    currentMatchup: {
        leftCategory: null,
        rightCategory: null,

        leftTrack: null,
        rightTrack: null
    },

    rounds: {
        total: 0,
        current: 0
    },

    // matchmaking algorithm settings
    settings: {
        probabilityDivisor: 0,
        probabilityCeil: 0,
        probabilityFloor: 0,
    }
};


function startTest(mode) { // runs when a mode is selected
    sessionStorage.setItem('mode', mode); // save mode
    window.location.href = "/pages/stage.html";
}


async function initializeTest() {
    testManager.mode = sessionStorage.getItem('mode');

    // config settings based on mode
    if (testManager.mode === 'eras') {
        testManager.categories = eras.slice();

        testManager.rounds.total = 15;

        testManager.settings.probabilityDivisor = 400;
        testManager.settings.probabilityCeil = 0.55;
        testManager.settings.probabilityFloor = 0.12;

    } else if (testManager.mode === 'composers') {
        testManager.categories = composers.slice();

        testManager.rounds.total = 30;

        testManager.settings.probabilityDivisor = 600;
        testManager.settings.probabilityCeil = 0.35;
        testManager.settings.probabilityFloor = 0.07;
    }

    displayCurrentRound(testManager);

    testManager.initialMatchupsRemaining = testManager.categories.slice(); // make copy of categories array so changes are not shared
    shuffleArray(testManager.initialMatchupsRemaining); // generate order of initial matchups

    // set the playlist property in each object to an array containing all the tracks in the playlist on deezer
    await loadPlaylists(testManager);

    selectMatchups(); // prepare first matchup
}

function selectMatchups() {
    if (testManager.onInitialMatchups) { // select initial matchups randomly
        testManager.currentMatchup.leftCategory = testManager.initialMatchupsRemaining[0];
        testManager.currentMatchup.rightCategory = testManager.initialMatchupsRemaining[1];

        testManager.initialMatchupsRemaining.splice(0, 2); // remove eras/composers used in current comparison -> remaining eras/composers participate in further comparisons
        
        if (testManager.initialMatchupsRemaining.length === 0) {
            testManager.onInitialMatchups = false; // all starting pairs of comparisons are made
        }
        
    } else { // select matchups based on probabilities
        testManager.currentMatchup.leftCategory = selectRandomWithProbability(testManager.categories);
        testManager.currentMatchup.rightCategory = selectRandomWithProbability(testManager.categories.filter(category => category !== testManager.currentMatchup.leftCategory)); // remove left side selected category from sample pool for right side
    }

    getRandomTracks(testManager.currentMatchup.leftCategory, testManager.currentMatchup.rightCategory);
}

// select post-initial matchups using a roulette wheel selection system
function selectRandomWithProbability(possibleSelections) {
    // calculate sum of all individual probability weights (total range)
    let probabilitySum = 0;

    for (const selection of possibleSelections) {
        probabilitySum += selection.probability;
    }

    // generate a random number between 0 and probabilitySum
    const randomNum = Math.random() * probabilitySum;

    // traverse eras/composers and add up probability weightings as individual slices until the randomly selected number is 'captured' by one of the categories  
    let cumulative = 0;

    for (const selection of possibleSelections) {
        cumulative += selection.probability;

        if (randomNum <= cumulative) { // random num is captured by slice just added
            return selection; // break loop
        }
    }
}

function getRandomTracks(leftCategory, rightCategory) {
    testManager.currentMatchup.leftTrack = leftCategory.getRandomTrack();
    testManager.currentMatchup.rightTrack = rightCategory.getRandomTrack();

    displayTracks(testManager.currentMatchup.leftTrack, testManager.currentMatchup.rightTrack);
}


function leftClick() {
    updateElo(testManager.currentMatchup.leftCategory, testManager.currentMatchup.rightCategory); // left category is the winner
}

function rightClick() {
    updateElo(testManager.currentMatchup.rightCategory, testManager.currentMatchup.leftCategory); // right category is the winner
}

function leftBtn(event) {
    event.stopPropagation(); // block click from being registered by overall side (button absorbs click)
    window.open(testManager.currentMatchup.leftTrack.link, '_blank');
}

function rightBtn(event) {
    event.stopPropagation();
    window.open(testManager.currentMatchup.rightTrack.link, '_blank');
}


// update elo and probability function: call on side click
function updateElo(winner, loser) {
    const winnerRating = winner.elo;
    const loserRating = loser.elo;
    const winProbability = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400)); // calculate the winning category's pre-comparison probability of winning based strictly on the relative elo difference

    // update elos
    const K = 40;
    const winnerEloGained = K * (1 - winProbability);
    const loserEloLost = -1 * winnerEloGained;

    winner.elo = winnerRating + winnerEloGained;
    loser.elo = loserRating + loserEloLost;

    // update probabilities based on elo gained/lost
    const winnerProbabilityGain = winnerEloGained / testManager.settings.probabilityDivisor;
    const loserProbabilityLoss = loserEloLost / testManager.settings.probabilityDivisor;

    if ((winner.probability + winnerProbabilityGain) > testManager.settings.probabilityCeil) {
        winner.probability = testManager.settings.probabilityCeil; // cap max probability
    } else {
        winner.probability += winnerProbabilityGain;
    }

    if ((loser.probability + loserProbabilityLoss) < testManager.settings.probabilityFloor) {
        loser.probability = testManager.settings.probabilityFloor; // cap min probability
    } else {
        loser.probability += loserProbabilityLoss;
    }

    // update round count
    testManager.rounds.current++;
    displayCurrentRound(testManager);
    
    // check for test completion
    if (testManager.rounds.current === testManager.rounds.total) {
        function sortOrder(property) {
            return function(a, b) {
                return b[property] - a[property];
            }
        }

        testManager.categories.sort(sortOrder('elo')); // sort categories by order of rating

        const categoriesSerialized = JSON.stringify(testManager.categories);
        sessionStorage.setItem('results', categoriesSerialized); // save array of categories as json

        sessionStorage.setItem('mode', testManager.mode); // save mode

        window.location.href = '/pages/results.html'; // display results

    } else {
        selectMatchups(); // next round
    }
}


// durstenfeld shuffle
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// enable functions to be accessed globally
window.modeSelector = modeSelector;
window.startTest = startTest;
window.initializeTest = initializeTest;
window.leftClick = leftClick;
window.rightClick = rightClick;
window.leftBtn = leftBtn;
window.rightBtn = rightBtn;
window.displayTracks = displayTracks;
window.displayResults = displayResults;