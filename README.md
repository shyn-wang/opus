# Opus

## Introduction
Classical music is one of the richest and most rewarding musical genres to listen to, comprised of an endless array of pieces hailing from distinct stylistic eras that span a combined several hundred years of history. But for this very reason, it can often feel intimidating and unapproachable for newcomers, as there are simply so many possible places to start.

_Opus is a music recommender that aims to introduce people to the world of classical piano through the use of an elo-based ranking system and dynamic matchmaking algorithm to run targeted head-to-head comparisons between different pieces and profile a user's tastes._

## How to Use
When using Opus, users can choose between either an era or composer mode:

**Era Mode** - a 15 round comparison test identifies a user's preferences for the four major stylistic eras (baroque, classical, romantic, and modern)

**Composer Mode** - a 30 round comparison test identifies a user's preferences for eight significant composers (js bach, mozart, beethoven, chopin, liszt, rachmaninoff, scriabin, and debussy)

The comparison test for both modes will present two selected pieces each round alongside a 30-second preview of each, and prompt users to choose the one they prefer. For information on the internal logic of the matchmaking and ranking systems, see [matchmaking algorithm](#matchmakingranking-algorithm).

At the end of the test, the top-ranked era(s) or composer(s) will be presented to the user as recommended starting points for listening.

-insert demo gif-
<br><br>


**Limitations:**

The head-to-head, sample-based testing methodology employed by Opus is inherently prone to inaccuracies, as it is impossible to form a complete opinion on a piece from a random 30-second clip (true for any genre, but especially so for classical, which is built on the idea of long-form consumption). Moreover, the algorithm may pair works of entirely different contexts with each other (i.e. one movement of a classical sonata vs a romantic lieder), making some comparisons inherently unfair. Consequently, results may be skewed in favor of eras or composers that do not best reflect the taste of the user.

Generally speaking, the composer test will provide a more consistent experience than its era counterpart, as it avoids the issue of large stylistic differences existing between composers categorized very broadly under one era (i.e. scriabin vs debussy under modern). However, it is also fundamentally limited in scope by omitting many great composers for the purpose of brevity.

Even with such limitations in mind, Opus can hopefully still prove valuable to complete newcomers to the world of classical music by acting as the guide that narrows their field of focus and directs their attention, ultimately helping them uncover music they love.

## Technical Overview

### API Usage
Opus communicates with the publicly accessible Deezer API (no authentication required) via GET requests to retrieve track data from curated composer and era specific playlists.

### Matchmaking/Ranking Algorithm
The core logic that powers Opus under-the-hood is built on two interconnected systems: an elo rating system and a probalistic roulette-wheel selection system.

**Elo rating system**
The elo-based ranking system is employed to track the relative positions of different eras or composers, and determine the final recommendations presented to the user. At the start of each test, all competing categories are assigned a base elo rating of 1500; as...

**Roulette wheel selection system**




