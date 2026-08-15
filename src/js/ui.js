import { loadPaletteAndPreview } from "./api.js";

// **start screen**

export function loadModeSelector() { // runs when start btn is clicked on landing page
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


// **stage screen**

export function displayCurrentRound(sessionManager) {
    const roundTrackerId = document.getElementById('roundTracker');
    roundTrackerId.textContent = `${sessionManager.rounds.current + 1}/${sessionManager.rounds.total}`;
}

// intakes objects containing track info
export async function displayMatchup(leftTrack, rightTrack) {
    const trackData = {
        leftTrack: leftTrack,
        rightTrack: rightTrack,

        paletteLeft: null,
        paletteRight: null
    }

    // wait for all required content to load before displaying - prevents staggered entry (i.e. album cover updated before background)
    await Promise.all([
        // load album covers
        preloadImage(leftTrack.album.cover_big),
        preloadImage(rightTrack.album.cover_big),

        // fetch new preview links (currently saved ones may have expired) & extract color palette info
        loadPaletteAndPreview(trackData)
    ]);

    // display titles & album covers
    displayTrackInfo(leftTrack, 'left');
    displayTrackInfo(rightTrack, 'right');

    // apply palette styling & set preview link
    applyStyling(leftTrack, 'left', trackData.paletteLeft);
    applyStyling(rightTrack, 'right', trackData.paletteRight);
}

function preloadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();

        img.onload = resolve;
        img.src = src; // loaded img link is stored in browser cache
    });
}

function displayTrackInfo(track, side) {
    const cover = track.album.cover_big;
    const title = track.title;

    document.getElementById(`${side}Cover`).src = cover; // assign cover -> served instantly since img url is already stored in cache
    document.getElementById(`${side}Title`).textContent = title; // assign title
}

function applyStyling(track, side, palette) {
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

    // set preview link
    const preview = track.preview;
    document.getElementById(`${side}Preview`).src = preview;
}


// **results screen**

export function displayResults() {
    // retrieve sorted results array from sessionStorage
    const categoriesStored = sessionStorage.getItem('results');
    const results = JSON.parse(categoriesStored);
    console.log(results);

    const mode = sessionStorage.getItem('mode');

    // display results
    const main = document.getElementById('main');
    main.style.gap = '50px';

    const title = document.querySelector('.title'); // get title element by class (first element -> only element of class '.title' on results page)
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