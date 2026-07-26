// import library file
const library = require('./library');

// set up color thief
const ColorThief = require('colorthief');

// import eras & composers
const eras = [
    library.baroque,
    library.classical,
    library.romantic,
    library.modern
];

const composers = [
    library.bach,
    library.mozart,
    library.beethoven,
    library.chopin,
    library.liszt,
    library.rachmaninoff,
    library.scriabin,
    library.debussy
];

let whichMode; // era or composer mode
let categories; // assigned to eras or composers depending on whichMode
let totalRounds;

// matchmaking algorithm settings - based on mode
const K = 40;
let probabilityDivisor;
let probabilityCeil;
let probabilityFloor;

// true when less than two (eras) or four (composers) matchups have occured
let onInitialMatchups = true;
let initialMatchups;

// tracks the categories on screen
let leftCategory;
let rightCategory;


// Helper function to bypass CORS without using a proxy -> TEMPORARY - remove once backend is built
function fetchDeezerJSONP(url) {
    return new Promise((resolve, reject) => {
        // Create a unique callback function name
        const callbackName = 'deezer_cb_' + Date.now() + Math.floor(Math.random() * 1000);
        
        // Define the global callback function
        window[callbackName] = function(data) {
            delete window[callbackName]; // Cleanup
            document.body.removeChild(script); // Cleanup
            resolve(data);
        };

        // Create the script tag
        const script = document.createElement('script');
        const sep = url.includes('?') ? '&' : '?';
        // Tell Deezer to return JSONP and trigger our callback
        script.src = `${url}${sep}output=jsonp&callback=${callbackName}`;
        script.onerror = reject;
        
        // Append to DOM to trigger the request
        document.body.appendChild(script);
    });
}

// set the playlist property in each object to an array containing all the tracks in the playlist on deezer
async function initializePlaylists(mode) {
    // check mode
    if (mode === 'eras') {
        whichMode = 'eras';
        categories = eras.slice();

        totalRounds = 15;
        probabilityDivisor = 400;
        probabilityCeil = 0.55;
        probabilityFloor = 0.12;

    } else if (mode === 'composers') {
        whichMode = 'composers';
        categories = composers.slice();

        totalRounds = 30;
        probabilityDivisor = 600;
        probabilityCeil = 0.35;
        probabilityFloor = 0.07;
    }

    initialMatchups = categories.slice(); // make copy of categories array so changes are not shared
    shuffleArray(initialMatchups); // generate order of initial matchups

    for (const category of categories) {
        const url = `https://api.deezer.com/playlist/${category.playlistID}/tracks`;

        try {
            const response = await fetchDeezerJSONP(url);

            category.playlist = response.data; // 'response.data' returns array of tracks
            category.numOfPlaylistTracks = response.total;
            console.log(category);

        } catch (error) {
            console.error(error);
        }
    }

    selectMatchups();
}

function selectMatchups() {
    if (onInitialMatchups) { // select initial matchups randomly
        leftCategory = initialMatchups[0];
        rightCategory = initialMatchups[1];

        initialMatchups.splice(0, 2); // remove eras/composers used in current comparison -> remaining eras/composers participate in further comparisons
        
        if (initialMatchups.length === 0) {
            onInitialMatchups = false; // all starting pairs of comparisons are made
        }
        
    } else { // select matchups based on probabilities
        leftCategory = selectRandomWithProbability(categories);
        rightCategory = selectRandomWithProbability(categories.filter(category => category !== leftCategory)); // remove left side selected category from sample pool for right side
    }

    getRandomTrack(leftCategory, rightCategory);
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

    const leftTrack = leftCategory.playlist[leftTrackIndex];
    leftCategory.playlist.splice(leftTrackIndex, 1); // remove used track from playlist

    const rightTrack = rightCategory.playlist[rightTrackIndex];
    rightCategory.playlist.splice(rightTrackIndex, 1);

    displayTracks(leftTrack, rightTrack);
}

// intakes objects containing track info
async function displayTracks(leftTrack, rightTrack) {
    // fetch new preview links (currently saved ones may have expired)
    const leftTrackURL = `https://api.deezer.com/track/${leftTrack.id}`;
    const rightTrackURL = `https://api.deezer.com/track/${rightTrack.id}`;

    try {
        const responseLeft = await fetchDeezerJSONP(leftTrackURL);
        const responseRight = await fetchDeezerJSONP(rightTrackURL);

        leftTrack.preview = responseLeft.preview; // update links
        rightTrack.preview = responseRight.preview;

    } catch (error) {
        console.error(error);
    }

    // **left side**

    const coverLeft = leftTrack.album.cover_big;
    const titleLeft = leftTrack.title;
    const previewLeft = leftTrack.preview;
    deezerLeft = leftTrack.link;

    let colorLeftOne;
    let colorLeftTwo;

    ColorThief.getPalette(coverLeft, 5) // extract colors from album cover
        .then(palette => { 
            colorLeftOne = palette[0];
            colorLeftTwo = palette[1];
            
            // style ui components based on extracted colors
            const leftSideId = document.getElementById('left');
            leftSideId.style.background = `linear-gradient(206deg, rgb(${colorLeftOne[0]}, ${colorLeftOne[1]}, ${colorLeftOne[2]}), rgb(${colorLeftTwo[0]}, ${colorLeftTwo[1]}, ${colorLeftTwo[2]}))`;

            const leftTitleId = document.getElementById('leftTitle');
            leftTitleId.style.color = `rgb(${colorLeftTwo[0]}, ${colorLeftTwo[1]}, ${colorLeftTwo[2]})`;

            const leftDescriptionId = document.getElementById('leftDescription');
            leftDescriptionId.style.color = `rgba(${colorLeftTwo[0]}, ${colorLeftTwo[1]}, ${colorLeftTwo[2]}, 0.8)`;

            const leftButtonId = document.getElementById('leftButton');
            leftButtonId.style.backgroundColor = `rgba(${colorLeftOne[0]}, ${colorLeftOne[1]}, ${colorLeftOne[2]}, 0.3)`;

            const leftButtonLabelId = document.getElementById('leftButtonLabel');
            leftButtonLabelId.style.color = `rgb(${colorLeftTwo[0]}, ${colorLeftTwo[1]}, ${colorLeftTwo[2]})`;

            leftSideId.addEventListener('mouseenter', function() {
                leftSideId.style.background = `linear-gradient(206deg, rgba(${colorLeftOne[0]}, ${colorLeftOne[1]}, ${colorLeftOne[2]}, 0.62), rgba(${colorLeftTwo[0]}, ${colorLeftTwo[1]}, ${colorLeftTwo[2]}, 1)), url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='6.97' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;
            });

            leftSideId.addEventListener('mouseleave', function() {
                leftSideId.style.background = `linear-gradient(206deg, rgb(${colorLeftOne[0]}, ${colorLeftOne[1]}, ${colorLeftOne[2]}), rgb(${colorLeftTwo[0]}, ${colorLeftTwo[1]}, ${colorLeftTwo[2]}))`;
            });
            
            // create shadow effect
            function generateShadowColor(rgbColor) {
                const shadowColor = rgbColor.map(component => Math.max(0, component - 30));
                return `rgba(${shadowColor[0]}, ${shadowColor[1]}, ${shadowColor[2]}, 0.8)`;
            }

            leftSideId.style.zIndex = 1;
            leftSideId.style.boxShadow = `30px 0 60px ${generateShadowColor(colorLeftOne)}`;

        })
        .catch(err => { console.log(err) });

    // display info
    const coverLeftId = document.getElementById('leftCover');
    const titleLeftId = document.getElementById('leftTitle');
    const descriptionLeftId = document.getElementById('leftDescription');
    const previewLeftId = document.getElementById('leftPreview');
    
    coverLeftId.src = coverLeft;
    titleLeftId.innerHTML = titleLeft
    descriptionLeftId.innerHTML = ``;
    previewLeftId.src = previewLeft;

    // **right side**

    const coverRight = rightTrack.album.cover_big;
    const titleRight = rightTrack.title;
    const previewRight = rightTrack.preview;
    deezerRight = rightTrack.link

    let colorRightOne;
    let colorRightTwo;

    ColorThief.getPalette(coverRight, 5)
        .then(palette => { 
            colorRightOne = palette[0];
            console.log(colorRightOne);

            colorRightTwo = palette[1];
            console.log(colorRightTwo);

            const rightSideId = document.getElementById('right');
            rightSideId.style.background = `linear-gradient(206deg, rgb(${colorRightOne[0]}, ${colorRightOne[1]}, ${colorRightOne[2]}), rgb(${colorRightTwo[0]}, ${colorRightTwo[1]}, ${colorRightTwo[2]}))`;

            const rightTitleId = document.getElementById('rightTitle');
            rightTitleId.style.color = `rgb(${colorRightTwo[0]}, ${colorRightTwo[1]}, ${colorRightTwo[2]})`;

            const rightDescriptionId = document.getElementById('rightDescription');
            rightDescriptionId.style.color = `rgba(${colorRightTwo[0]}, ${colorRightTwo[1]}, ${colorRightTwo[2]}, 0.8)`;

            const rightButtonId = document.getElementById('rightButton');
            rightButtonId.style.backgroundColor = `rgba(${colorRightOne[0]}, ${colorRightOne[1]}, ${colorRightOne[2]}, 0.3)`;

            const rightButtonLabelId = document.getElementById('rightButtonLabel');
            rightButtonLabelId.style.color = `rgb(${colorRightTwo[0]}, ${colorRightTwo[1]}, ${colorRightTwo[2]})`;

            rightSideId.addEventListener('mouseenter', function() {
                rightSideId.style.background = `linear-gradient(206deg, rgba(${colorRightOne[0]}, ${colorRightOne[1]}, ${colorRightOne[2]}, 0.62), rgba(${colorRightTwo[0]}, ${colorRightTwo[1]}, ${colorRightTwo[2]}, 1)), url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='6.97' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;
            });

            rightSideId.addEventListener('mouseleave', function() {
                rightSideId.style.background = `linear-gradient(206deg, rgb(${colorRightOne[0]}, ${colorRightOne[1]}, ${colorRightOne[2]}), rgb(${colorRightTwo[0]}, ${colorRightTwo[1]}, ${colorRightTwo[2]}))`;
            });

            function generateShadowColor(rgbColor) {
                const shadowColor = rgbColor.map(component => Math.max(0, component - 30));
                return `rgba(${shadowColor[0]}, ${shadowColor[1]}, ${shadowColor[2]}, 0.8)`;
            }

            rightSideId.style.zIndex = 1;
            rightSideId.style.boxShadow = `30px 0 60px ${generateShadowColor(colorRightOne)}`;
        })
        .catch(err => { console.log(err) });

    // display info
    const coverRightId = document.getElementById('rightCover');
    const titleRightId = document.getElementById('rightTitle');
    const descriptionRightId = document.getElementById('rightDescription');
    const previewRightId = document.getElementById('rightPreview');
    
    coverRightId.src = coverRight;
    titleRightId.innerHTML = titleRight;
    descriptionRightId.innerHTML = ``;
    previewRightId.src = previewRight;
}


function leftClick() {
    updateElo(leftCategory, rightCategory); // left category is the winner
}

function rightClick() {
    updateElo(rightCategory, leftCategory); // right category is the winner
    
}

// stores external url
let deezerLeft;
let deezerRight;

function leftBtn(event) {
    event.stopPropagation(); // block click from being registered by overall side (button absorbs click)
    window.open(deezerLeft, '_blank');
}

function rightBtn(event) {
    event.stopPropagation();
    window.open(deezerRight, '_blank');
}


// track number of rounds elapsed
let numOfRounds = 0;
let currentRound = 1;

// update elo and probability function: call on side click
function updateElo(winner, loser) {
    // calculate expected win probability
    const winnerRating = winner.elo;
    const loserRating = loser.elo;
    const winProbability = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));

    // update elos
    const winnerEloGained = K * (1 - winProbability);
    const loserEloLost = -1 * winnerEloGained;

    winner.elo = winnerRating + winnerEloGained;
    loser.elo = loserRating + loserEloLost;

    // update probabilities based on elo gained/lost
    const winnerProbabilityGain = winnerEloGained / probabilityDivisor;
    const loserProbabilityLoss = loserEloLost / probabilityDivisor;

    if ((winner.probability + winnerProbabilityGain) > probabilityCeil) {
        winner.probability = probabilityCeil; // cap max probability
    } else {
        winner.probability += winnerProbabilityGain;
    }

    if ((loser.probability + loserProbabilityLoss) < probabilityFloor) {
        loser.probability = probabilityFloor; // cap min probability
    } else {
        loser.probability += loserProbabilityLoss;
    }

    numOfRounds++;
    currentRound++;
    updateCurrentRound();
    
    if (numOfRounds === totalRounds) { // end of test
        function sortOrder(property) {
            return function(a, b) {
                return b[property] - a[property];
            }
        }

        categories.sort(sortOrder('elo'));

        const categoriesSerialized = JSON.stringify(categories);

        sessionStorage.setItem('results', categoriesSerialized);
        window.location.href = 'results.html';

    } else {
        selectMatchups();
    }
}

function updateCurrentRound() {
    const roundTrackerId = document.getElementById('roundTracker');
    roundTrackerId.innerHTML = `${currentRound}/${totalRounds}`;
}



function displayResults() {
    // retrieve sorted results array from sessionStorage
    const categoriesStored = sessionStorage.getItem('results');
    const results = JSON.parse(categoriesStored);
    console.log(results);

    // display results
    const first = results[0].name;
    const second = results[1].name;
    const third = results[2].name;
    const fourth = results[3].name;

    const firstId = document.getElementById('first');
    const secondId = document.getElementById('second');
    const thirdId = document.getElementById('third');
    const fourthId = document.getElementById('fourth');

    firstId.innerHTML = `1. ${first}`;
    secondId.innerHTML = `2. ${second}`;
    thirdId.innerHTML = `3. ${third}`;
    fourthId.innerHTML = `4. ${fourth}`;
}


// durstenfeld shuffle
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// enable functions to be accessed globally
window.initializePlaylists = initializePlaylists;
window.updateCurrentRound = updateCurrentRound;
window.leftClick = leftClick;
window.rightClick = rightClick;
window.leftBtn = leftBtn;
window.rightBtn = rightBtn;
window.displayTracks = displayTracks;
window.displayResults = displayResults;