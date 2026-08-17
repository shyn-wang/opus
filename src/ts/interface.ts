// handles event binding -> enables page elements to interface with (access & run) code based on corresponding user actions

import { SessionManager } from "./script";
import { loadModeSelector, displayResults } from "./ui";

import type { Category } from "./library";
import type { DeezerTrack } from "./types";

const session = new SessionManager(); // create new session instance -> object used to control test progression

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
     (document.getElementById('startBtn') as HTMLButtonElement)
        .addEventListener('click', () => {
            loadModeSelector();
        });


    (document.getElementById('era') as HTMLButtonElement)
        .addEventListener('click', () => {
            session.startTest('eras');
        });

    (document.getElementById('composer') as HTMLButtonElement)
        .addEventListener('click', () => {
            session.startTest('composers');
        });
}

function bindStageEvents() {
    // left side wins
    (document.getElementById('left') as HTMLDivElement)
        .addEventListener('click', () => {
            const winner = session.currentMatchup.leftCategory as Category;
            const loser = session.currentMatchup.rightCategory as Category;

            session.processMatchupResults(winner, loser);

            if (session.completed) {
                session.endTest();
            }
        });
    
    // right side wins
    (document.getElementById('right') as HTMLDivElement)
        .addEventListener('click', () => {
            const winner = session.currentMatchup.rightCategory as Category;
            const loser = session.currentMatchup.leftCategory as Category;

            session.processMatchupResults(winner, loser);

            if (session.completed) {
                session.endTest();
            }
        });


    // left deezer link
    (document.getElementById('leftButton') as HTMLButtonElement)
        .addEventListener('click', (event) => {
            event.stopPropagation(); // block button click from being registered by overall side (button absorbs click)
            window.open((session.currentMatchup.leftTrack as DeezerTrack).link, '_blank');
        });

    // right deezer link
    (document.getElementById('rightButton') as HTMLButtonElement)
        .addEventListener('click', (event) => {
            event.stopPropagation();
            window.open((session.currentMatchup.rightTrack as DeezerTrack).link, '_blank');
        });


    // stop audio player interactions from registering as side clicks
    (document.getElementById('leftPreview') as HTMLAudioElement)
        .addEventListener('click', (event) => {
            event.stopPropagation(); // absorb click
        });

    (document.getElementById('rightPreview') as HTMLAudioElement)
        .addEventListener('click', (event) => {
            event.stopPropagation();
        });
}
