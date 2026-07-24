// import library file
const library = require('./library');

// set up color thief
const ColorThief = require('colorthief');

// array containing the four era objects
const eras = [
    library.baroque,
    library.classical,
    library.romantic,
    library.modern
]

// true when less than two matchups have occured
let onInitialMatchups = true;
let initialMatchups = eras.slice(); // make copy of eras array so changes are not shared

shuffleArray(initialMatchups);

// tracks the eras on screen
let leftEra;
let rightEra;


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

// set the playlist property in each era object to an array containing all the tracks in the playlist on deezer
async function initializePlaylists() {
    for (const era of eras) {
        const url = `https://api.deezer.com/playlist/${era.playlistID}/tracks`;

        try {
            const response = await fetchDeezerJSONP(url);

            era.playlist = response.data; // 'response.data' returns array of tracks
            era.numOfPlaylistTracks = response.total;

        } catch (error) {
            console.error(error);
        }
    }

    selectMatchups();
}

function selectMatchups() {
    if (onInitialMatchups) { // select initial matchups randomly
        leftEra = initialMatchups[0];
        rightEra = initialMatchups[1];

        initialMatchups.splice(0, 2); // remove eras used in first comparison -> remaining eras participate in second comparison
        
        if (initialMatchups.length === 0) {
            onInitialMatchups = false; // both starting comparisons are made
        }
        
    } else { // select matchups based on probabilities
        leftEra = selectRandomWithProbability();
        rightEra = selectRandomWithProbability();
        
        if (rightEra === leftEra) { // force distinct matchups
            while (rightEra === leftEra) {
                rightEra = selectRandomWithProbability();
            }
        }
    }

    getRandomTrack(leftEra, rightEra);
}

// select post-initial matchups using a roulette wheel selection algorithm
function selectRandomWithProbability() {
    // calculate sum of all probability weights (total range)
    let probabilitySum = 0;

    for (const era of eras) {
        probabilitySum += era.probability;
    }

    // generate a random number between 0 and probabilitySum
    const randomNum = Math.random() * probabilitySum;

    // traverse eras array and add up probability weightings as individual slices until the randomly selected number is 'captured' by one of the eras  
    let cumulative = 0;

    for (const era of eras) {
        cumulative += era.probability;

        if (randomNum <= cumulative) { // random num is captured by one of the slices
            return era; // break
        }
    }
}

function getRandomTrack(leftEra, rightEra) {
    const rangeLeft = leftEra.playlist.length -1;
    const rangeRight = rightEra.playlist.length -1;

    const leftTrackIndex = Math.floor(Math.random() * (rangeLeft + 1));
    const rightTrackIndex = Math.floor(Math.random() * (rangeRight + 1));

    const leftTrack = leftEra.playlist[leftTrackIndex];
    leftEra.playlist.splice(leftTrackIndex, 1); // remove used track from playlist

    const rightTrack = rightEra.playlist[rightTrackIndex];
    rightEra.playlist.splice(rightTrackIndex, 1);

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

    // album cover
    const coverLeft = leftTrack.album.cover_big;

    let colorLeftOne;
    let colorLeftTwo;

    ColorThief.getPalette(coverLeft, 5)
        .then(palette => { 
            colorLeftOne = palette[0];
            console.log(colorLeftOne);

            colorLeftTwo = palette[1];
            console.log(colorLeftTwo);

            const leftSideId = document.getElementById('left');
            leftSideId.style.background = `linear-gradient(206deg, rgb(${colorLeftOne[0]}, ${colorLeftOne[1]}, ${colorLeftOne[2]}), rgb(${colorLeftTwo[0]}, ${colorLeftTwo[1]}, ${colorLeftTwo[2]})`;

            const leftTitleId = document.getElementById('leftTitle');
            leftTitleId.style.color = `rgb(${colorLeftTwo[0]}, ${colorLeftTwo[1]}, ${colorLeftTwo[2]})`;

            const leftDescriptionId = document.getElementById('leftDescription');
            leftDescriptionId.style.color = `rgba(${colorLeftTwo[0]}, ${colorLeftTwo[1]}, ${colorLeftTwo[2]}, 0.8)`;

            const leftButtonId = document.getElementById('leftButton');
            leftButtonId.style.backgroundColor = `rgba(${colorLeftOne[0]}, ${colorLeftOne[1]}, ${colorLeftOne[2]}, 0.3)`;

            const leftButtonLabelId = document.getElementById('leftButtonLabel');
            leftButtonLabelId.style.color = `rgb(${colorLeftTwo[0]}, ${colorLeftTwo[1]}, ${colorLeftTwo[2]})`;

            leftSideId.addEventListener('mouseenter', function() {
                leftSideId.style.background = leftSideId.style.background = `linear-gradient(206deg, rgba(${colorLeftOne[0]}, ${colorLeftOne[1]}, ${colorLeftOne[2]}, 0.62), rgba(${colorLeftTwo[0]}, ${colorLeftTwo[1]}, ${colorLeftTwo[2]}, 1)), url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='6.97' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;
            });

            leftSideId.addEventListener('mouseleave', function() {
                leftSideId.style.background = `linear-gradient(206deg, rgb(${colorLeftOne[0]}, ${colorLeftOne[1]}, ${colorLeftOne[2]}), rgb(${colorLeftTwo[0]}, ${colorLeftTwo[1]}, ${colorLeftTwo[2]}))`;
            });

            function generateShadowColor(rgbColor) {
                // Reduce the brightness of the color for the shadow effect
                const shadowColor = rgbColor.map(component => Math.max(0, component - 30));
                return `rgba(${shadowColor[0]}, ${shadowColor[1]}, ${shadowColor[2]}, 0.8)`;
            }

            leftSideId.style.zIndex = 1;
            leftSideId.style.boxShadow = `30px 0 60px ${generateShadowColor(colorLeftOne)}`;

        })
        .catch(err => { console.log(err) });

    // piece title
    const titleLeft = leftTrack.title;
    
    // preview url
    const previewLeft = leftTrack.preview;
    
    // deezer url
    deezerLeft = leftTrack.link;

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

    // album cover
    const coverRight = rightTrack.album.cover_big;

    let colorRightOne;
    let colorRightTwo;

    ColorThief.getPalette(coverRight, 5)
        .then(palette => { 
            colorRightOne = palette[0];
            console.log(colorRightOne);

            colorRightTwo = palette[1];
            console.log(colorRightTwo);

            const rightSideId = document.getElementById('right');
            rightSideId.style.background = `linear-gradient(206deg, rgb(${colorRightOne[0]}, ${colorRightOne[1]}, ${colorRightOne[2]}), rgb(${colorRightTwo[0]}, ${colorRightTwo[1]}, ${colorRightTwo[2]})`;

            const rightTitleId = document.getElementById('rightTitle');
            rightTitleId.style.color = `rgb(${colorRightTwo[0]}, ${colorRightTwo[1]}, ${colorRightTwo[2]})`;

            const rightDescriptionId = document.getElementById('rightDescription');
            rightDescriptionId.style.color = `rgba(${colorRightTwo[0]}, ${colorRightTwo[1]}, ${colorRightTwo[2]}, 0.8)`;

            const rightButtonId = document.getElementById('rightButton');
            rightButtonId.style.backgroundColor = `rgba(${colorRightOne[0]}, ${colorRightOne[1]}, ${colorRightOne[2]}, 0.3)`;

            const rightButtonLabelId = document.getElementById('rightButtonLabel');
            rightButtonLabelId.style.color = `rgb(${colorRightTwo[0]}, ${colorRightTwo[1]}, ${colorRightTwo[2]})`;

            rightSideId.addEventListener('mouseenter', function() {
                rightSideId.style.background = rightSideId.style.background = `linear-gradient(206deg, rgba(${colorRightOne[0]}, ${colorRightOne[1]}, ${colorRightOne[2]}, 0.62), rgba(${colorRightTwo[0]}, ${colorRightTwo[1]}, ${colorRightTwo[2]}, 1)), url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='6.97' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;
            });

            rightSideId.addEventListener('mouseleave', function() {
                rightSideId.style.background = `linear-gradient(206deg, rgb(${colorRightOne[0]}, ${colorRightOne[1]}, ${colorRightOne[2]}), rgb(${colorRightTwo[0]}, ${colorRightTwo[1]}, ${colorRightTwo[2]}))`;
            });

            function generateShadowColor(rgbColor) {
                // Reduce the brightness of the color for the shadow effect
                const shadowColor = rgbColor.map(component => Math.max(0, component - 30));
                return `rgba(${shadowColor[0]}, ${shadowColor[1]}, ${shadowColor[2]}, 0.8)`;
            }

            rightSideId.style.zIndex = 1;
            rightSideId.style.boxShadow = `30px 0 60px ${generateShadowColor(colorRightOne)}`;
        })
        .catch(err => { console.log(err) });

    // piece title
    const titleRight = rightTrack.title;
    
    // preview url
    const previewRight = rightTrack.preview;
    
    // deezer url
    deezerRight = rightTrack.link

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


// check to see if either the button or the side was clicked
let leftBtnClick = false;
let rightBtnClick = false;

function leftClick() {
    if (leftBtnClick == true) {
        console.log('btn left clicked');
        leftBtnClick = false;
    } else {
        console.log('side left clicked');
        updateElo(leftEra, rightEra);
    }
}

function rightClick() {
    if (rightBtnClick == true) {
        console.log('btn right clicked');
        rightBtnClick = false;
    } else {
        console.log('side right clicked');
        updateElo(rightEra, leftEra);
    }
}

// set to spotify url by displayTracks function
let deezerLeft;

function leftBtn() {
    leftBtnClick = true;
    window.open(deezerLeft, '_blank');
}

// set to spotfiy url by displayTracks function
let deezerRight;

function rightBtn() {
    rightBtnClick = true;
    window.open(deezerRight, '_blank');
}

// durstenfeld shuffle
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
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

    // update Elos
    const K = 32;
    const winnerEloGained = K * (1 - winProbability);
    const loserEloLost = K * (0 - winProbability);

    winner.elo = winnerRating + winnerEloGained;
    loser.elo = loserRating + loserEloLost;

    // update probabilities based on elo gained/lost
    const winnerUpdatedProbability = winnerEloGained / 128;
    const loserUpdatedProbability = loserEloLost / 128;

    winner.probability += winnerUpdatedProbability;

    if ((loser.probability + loserUpdatedProbability) < 0.10) {
        loser.probability = 0.10;
    } else {
        loser.probability += loserUpdatedProbability;
    }

    numOfRounds++;
    currentRound++;
    updateCurrentRound();
    
    if (numOfRounds == 15) {
        function sortOrder(property) {
            return function(a, b) {
                return b[property] - a[property];
            }
        }

        eras.sort(sortOrder('elo'));
        console.log(eras);

        const erasSerialized = JSON.stringify(eras);
        sessionStorage.setItem('results', erasSerialized);
        window.location.href = 'results.html';
    } else {
        selectMatchups();
    }
}

function displayResults() {
    // retrieve sorted eras array from sessionStorage
    const erasStored = sessionStorage.getItem('results');
    const results = JSON.parse(erasStored);
    console.log(results);

    // display results
    const first = results[0].name;
    const second = results[1].name;
    const third = results[2].name;
    const fourth = results[3].name;
    let recommendedComposers;

    if (first == 'romantic') {
        recommendedComposers = ['Chopin', 'Liszt', 'Schubert'];
    } else if (first == 'classical') {
        recommendedComposers = ['Beethoven', 'Mozart', 'Haydn'];
    } else if (first == 'baroque') {
        recommendedComposers = ['J.S. Bach', 'Handel', 'Couperin'];
    } else if (first == 'modern') {
        recommendedComposers = ['Debussy', 'Ravel', 'Scriabin'];
    }

    const firstId = document.getElementById('first');
    const secondId = document.getElementById('second');
    const thirdId = document.getElementById('third');
    const fourthId = document.getElementById('fourth');

    firstId.innerHTML = `1. ${first}`;
    secondId.innerHTML = `2. ${second}`;
    thirdId.innerHTML = `3. ${third}`;
    fourthId.innerHTML = `4. ${fourth}`;

    const composerOneId = document.getElementById('composerOne');
    const composerTwoId = document.getElementById('composerTwo');
    const composerThreeId = document.getElementById('composerThree');

    composerOneId.innerHTML = recommendedComposers[0];
    composerTwoId.innerHTML = recommendedComposers[1];
    composerThreeId.innerHTML = recommendedComposers[2];
}

function updateCurrentRound() {
    const roundTrackerId = document.getElementById('roundTracker');
    roundTrackerId.innerHTML = `${currentRound}/15`;
}


// enable functions to be accessed globally
window.initializePlaylists = initializePlaylists;
window.leftClick = leftClick;
window.rightClick = rightClick;
window.leftBtn = leftBtn;
window.rightBtn = rightBtn;
window.displayTracks = displayTracks;
window.displayResults = displayResults;