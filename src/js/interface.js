// handles event binding -> enables page elements to interface with (access & run) code based on corresponding user actions

import { SessionManager } from "./script.js";
import { loadModeSelector, displayResults } from "./ui.js";

const session = new SessionManager();

document.addEventListener('DOMContentLoaded', () => {
    initializePage(); // run on page load
});

function initializePage() {
    const currentPage = document.body.dataset.page;

    if (currentPage === 'home') {
        bindHomeEvents();

    } else if (currentPage === 'stage') {
        bindStageEvents();

        session.initializeTest();

    } else if (currentPage === 'results') {
        displayResults();
    }
}

function bindHomeEvents() {
     document.getElementById('startBtn')
        .addEventListener('click', () => {
            loadModeSelector();
        });


    document.getElementById('era')
        .addEventListener('click', () => {
            session.startTest('eras');
        });

    document.getElementById('composer')
        .addEventListener('click', () => {
            session.startTest('composers');
        });
}

function bindStageEvents() {
    // left side wins
    document.getElementById('left')
        .addEventListener('click', () => {
            const winner = session.currentMatchup.leftCategory;
            const loser = session.currentMatchup.rightCategory;

            session.processMatchupResults(winner, loser);

            if (session.completed) {
                session.endTest();
            }
        });
    
    // right side wins
    document.getElementById('right')
        .addEventListener('click', () => {
            const winner = session.currentMatchup.rightCategory;
            const loser = session.currentMatchup.leftCategory;

            session.processMatchupResults(winner, loser);

            if (session.completed) {
                session.endTest();
            }
        });


    // left deezer link
    document.getElementById('leftButton')
        .addEventListener('click', (event) => {
            event.stopPropagation(); // block button click from being registered by overall side (button absorbs click)
            window.open(session.currentMatchup.leftTrack.link, '_blank');
        });

    // right deezer link
    document.getElementById('rightButton')
        .addEventListener('click', (event) => {
            event.stopPropagation();
            window.open(session.currentMatchup.rightTrack.link, '_blank');
        });


    // stop audio player interactions from registering as side clicks
    document.getElementById('leftPreview')
        .addEventListener('click', (event) => {
            event.stopPropagation();
        });

    document.getElementById('rightPreview')
        .addEventListener('click', (event) => {
            event.stopPropagation();
        });
}
