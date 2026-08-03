// durstenfeld shuffle
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


// select categories comprising a matchup
export function createMatchup(sessionManager) {
    // select categories part of initial matchups randomly (initialMatchupsRemaining is shuffled)
    if (sessionManager.onInitialMatchups) {
        sessionManager.currentMatchup.leftCategory = sessionManager.initialMatchupsRemaining[0];
        sessionManager.currentMatchup.rightCategory = sessionManager.initialMatchupsRemaining[1];

        sessionManager.initialMatchupsRemaining.splice(0, 2); // remove eras/composers used in current comparison -> remaining eras/composers participate in further comparisons
    
        if (sessionManager.initialMatchupsRemaining.length === 0) {
            sessionManager.onInitialMatchups = false; // all starting pairs of comparisons are made
        }
    
    } else { // select categories part of subsequent matchups based on probabilities using roulette wheel
        sessionManager.currentMatchup.leftCategory = selectRandomWithProbability(sessionManager.categories);
        sessionManager.currentMatchup.rightCategory = selectRandomWithProbability(sessionManager.categories.filter(category => category !== sessionManager.currentMatchup.leftCategory)); // remove left side selected category from sample pool for right side
    }

    getRandomTracks(sessionManager);
}

function getRandomTracks(sessionManager) {
    const leftCategory = sessionManager.currentMatchup.leftCategory;
    const rightCategory = sessionManager.currentMatchup.rightCategory;

    sessionManager.currentMatchup.leftTrack = leftCategory.getRandomTrack();
    sessionManager.currentMatchup.rightTrack = rightCategory.getRandomTrack();
}


// used to select post-initial matchups using a roulette wheel selection system
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

// update elo and probability function: called when a round is completed
export function updateEloAndProbability(winner, loser, settings) {
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
    const winnerProbabilityGain = winnerEloGained / settings.probabilityDivisor;
    const loserProbabilityLoss = loserEloLost / settings.probabilityDivisor;

    if ((winner.probability + winnerProbabilityGain) > settings.probabilityCeil) {
        winner.probability = settings.probabilityCeil; // cap max probability
    } else {
        winner.probability += winnerProbabilityGain;
    }

    if ((loser.probability + loserProbabilityLoss) < settings.probabilityFloor) {
        loser.probability = settings.probabilityFloor; // cap min probability
    } else {
        loser.probability += loserProbabilityLoss;
    }
}