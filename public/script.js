// import library file
import { eras, composers } from './library.js';

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


function modeSelector() { // runs when start btn is clicked on landing page
    const parent = document.getElementById("parent");

    const oldDiv = document.getElementById("startScreen");
    const newDiv = document.getElementById("modeSelectorScreen");

    parent.replaceChild(newDiv, oldDiv); // swap start title/btn with mode selector
    newDiv.style.display = "block"; // show div -> initially hidden

    const btns = document.getElementsByClassName("ButtonEnter");
    for (const btn of btns) {
        btn.style.width = "200px"; // increase btn sizes (to fit 'composer')
    }
}

function startTest(mode) { // runs when a mode is selected
    sessionStorage.setItem('mode', mode); // save mode
    window.location.href = "stage.html";
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

    updateCurrentRound(); // update to show totalRounds

    testManager.initialMatchupsRemaining = testManager.categories.slice(); // make copy of categories array so changes are not shared

    shuffleArray(testManager.initialMatchupsRemaining); // generate order of initial matchups

    // set the playlist property in each object to an array containing all the tracks in the playlist on deezer
    for (const category of testManager.categories) {
        const url = `/api/playlist/${category.playlistID}`;

        try {
            const response = await (await fetch(url)).json();

            category.playlist = response.data; // 'response.data' returns array of tracks
            category.numOfPlaylistTracks = response.total;

            console.log(category);

        } catch (error) {
            console.error(error);
        }
    }

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

    getRandomTrack(testManager.currentMatchup.leftCategory, testManager.currentMatchup.rightCategory);
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

function getRandomTrack(leftCategory, rightCategory) {
    const rangeLeft = leftCategory.playlist.length -1;
    const rangeRight = rightCategory.playlist.length -1;

    const leftTrackIndex = Math.floor(Math.random() * (rangeLeft + 1));
    const rightTrackIndex = Math.floor(Math.random() * (rangeRight + 1));

    testManager.currentMatchup.leftTrack = leftCategory.playlist[leftTrackIndex];
    leftCategory.playlist.splice(leftTrackIndex, 1); // remove used track from playlist

    testManager.currentMatchup.rightTrack = rightCategory.playlist[rightTrackIndex];
    rightCategory.playlist.splice(rightTrackIndex, 1);

    displayTracks(testManager.currentMatchup.leftTrack, testManager.currentMatchup.rightTrack);
}

// intakes objects containing track info
async function displayTracks(leftTrack, rightTrack) {
    // fetch new preview links (currently saved ones may have expired) & extract color palette info
    const leftTrackURL = `/api/track/${leftTrack.id}`;
    const rightTrackURL = `/api/track/${rightTrack.id}`;

    let paletteLeft;
    let paletteRight;

    try {
        const responseLeft = await (await fetch(leftTrackURL)).json();
        const responseRight = await (await fetch(rightTrackURL)).json();

        console.log(responseLeft);
        console.log(responseRight);

        leftTrack.preview = responseLeft.preview; // update links
        rightTrack.preview = responseRight.preview;

        paletteLeft = responseLeft.palette;
        paletteRight = responseRight.palette;

    } catch (error) {
        console.error(error);
    }

    // **left side**
    displayTrack(leftTrack, 'left', paletteLeft);

    // **right side**
    displayTrack(rightTrack, 'right', paletteRight);
}

function displayTrack(track, side, palette) {
    const cover = track.album.cover_big;
    const title = track.title;
    const preview = track.preview;

    const colorOne = palette[0];
    const colorTwo = palette[1];
    
    // style ui components based on extracted colors
    const sideId = document.getElementById(side);
    sideId.style.background = `linear-gradient(206deg, rgb(${colorOne[0]}, ${colorOne[1]}, ${colorOne[2]}), rgb(${colorTwo[0]}, ${colorTwo[1]}, ${colorTwo[2]}))`;

    const titleId = document.getElementById(`${side}Title`);
    titleId.style.color = `rgb(${colorTwo[0]}, ${colorTwo[1]}, ${colorTwo[2]})`;

    const descriptionId = document.getElementById(`${side}Description`);
    descriptionId.style.color = `rgba(${colorTwo[0]}, ${colorTwo[1]}, ${colorTwo[2]}, 0.8)`;

    const buttonId = document.getElementById(`${side}Button`);
    buttonId.style.backgroundColor = `rgba(${colorOne[0]}, ${colorOne[1]}, ${colorOne[2]}, 0.3)`;

    const buttonLabelId = document.getElementById(`${side}ButtonLabel`);
    buttonLabelId.style.color = `rgb(${colorTwo[0]}, ${colorTwo[1]}, ${colorTwo[2]})`;

    sideId.addEventListener('mouseenter', function() {
        sideId.style.background = `linear-gradient(206deg, rgba(${colorOne[0]}, ${colorOne[1]}, ${colorOne[2]}, 0.62), rgba(${colorTwo[0]}, ${colorTwo[1]}, ${colorTwo[2]}, 1)), url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='6.97' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;
    });

    sideId.addEventListener('mouseleave', function() {
        sideId.style.background = `linear-gradient(206deg, rgb(${colorOne[0]}, ${colorOne[1]}, ${colorOne[2]}), rgb(${colorTwo[0]}, ${colorTwo[1]}, ${colorTwo[2]}))`;
    });
    
    // create shadow effect
    function generateShadowColor(rgbColor) {
        const shadowColor = rgbColor.map(component => Math.max(0, component - 30));
        return `rgba(${shadowColor[0]}, ${shadowColor[1]}, ${shadowColor[2]}, 0.8)`;
    }

    sideId.style.zIndex = '1';
    sideId.style.boxShadow = `30px 0 60px ${generateShadowColor(colorOne)}`;

    // display info
    const coverId = document.getElementById(`${side}Cover`);
    const previewId = document.getElementById(`${side}Preview`);
    
    coverId.src = cover;
    titleId.textContent = title;
    descriptionId.textContent = ``;
    previewId.src = preview;
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

    testManager.rounds.current++;
    updateCurrentRound();
    
    if (testManager.rounds.current === testManager.rounds.total) { // end of test
        function sortOrder(property) {
            return function(a, b) {
                return b[property] - a[property];
            }
        }

        testManager.categories.sort(sortOrder('elo')); // sort categories by order of rating

        const categoriesSerialized = JSON.stringify(testManager.categories);
        sessionStorage.setItem('results', categoriesSerialized); // save array of categories as json

        sessionStorage.setItem('mode', testManager.mode); // save mode

        window.location.href = 'results.html'; // display results

    } else {
        selectMatchups();
    }
}

function updateCurrentRound() {
    const roundTrackerId = document.getElementById('roundTracker');
    roundTrackerId.textContent = `${testManager.rounds.current + 1}/${testManager.rounds.total}`;
}


function displayResults() {
    // retrieve sorted results array from sessionStorage
    const categoriesStored = sessionStorage.getItem('results');
    const results = JSON.parse(categoriesStored);
    console.log(results);

    const mode = sessionStorage.getItem('mode');

    // display results
    const main = document.getElementById('main');
    main.style.gap = '50px';

    const title = document.getElementById('title');
    title.style.width = '1200px';
    title.textContent = `Your favourite ${mode} are`;

    // get top category names
    const first = results[0].name;
    const second = results[1].name;
    const third = results[2].name;
    const fourth = results[3].name;

    const firstId = document.getElementById('first');
    const secondId = document.getElementById('second');
    const thirdId = document.getElementById('third');
    const fourthId = document.getElementById('fourth');

    firstId.textContent = `1. ${first}`;
    secondId.textContent = `2. ${second}`;
    thirdId.textContent = `3. ${third}`;
    fourthId.textContent = `4. ${fourth}`;
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
window.updateCurrentRound = updateCurrentRound;
window.leftClick = leftClick;
window.rightClick = rightClick;
window.leftBtn = leftBtn;
window.rightBtn = rightBtn;
window.displayTracks = displayTracks;
window.displayResults = displayResults;