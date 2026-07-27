# Opus

## Introduction
Classical music is one of the richest and most rewarding musical genres to listen to, featuring an endless array of pieces hailing from distinct stylistic eras that span a combined several hundred years of history. For this reason, it is also notoriously overwhelming and difficult for newcomers to naturally discover and appreciate, as there are simply so many possible places to begin.

Opus is a music recommender that aims to introduce people to the world of classical piano through the use of an elo-based ranking system and dynamic matchmaking algorithm to run targeted head-to-head comparisons between different pieces and profile a user's tastes over time.

## How it Works
When using Opus, users can choose between either an era or composer mode:

**Era** - a 15 round comparison test identifies a user's order of preference for the four major stylistic eras (baroque, classical, romantic, and modern)

**Composer** - a 30 round comparison test identifies a user's order of preference for eight significant composers (js bach, mozart, beethoven, chopin, liszt, rachmaninoff, scriabin, and debussy)

The comparison test for both modes will present two selected pieces each round alongside a 30-second preview of each, and prompt users to choose the one they prefer. For information on the internal logic of the matchmaking and ranking systems, see [matchmaking algorithm](#matchmakingranking-algorithm).

At the end of the test, the top-ranked era(s) or composer(s) will be presented to the user as likely interests and recommended starting points for listening.

-insert demo gif-
<br><br>


**Limitations:**

The head-to-head, sample-based testing methodology employed by Opus is inherently prone to inaccuracies, as it is impossible to form a complete opinion on a piece from a random 30-second clip (true for any genre, but especially so for classical, which is built on long musical journeys with satisfying payoffs). Moreover, the algorithm may pair works of entirely different contexts with each other (i.e. one movement of a classical sonata vs a romantic lieder), making some comparisons inherently unfair. Consequently, results may be skewed in favor of eras or composers that do not best reflect the taste of the user.

Even with such limitations in mind, Opus can hopefully still prove valuable to complete newcomers to the world of classical music by acting as the guide that helps narrow their field of focus and directs them in a general direction, ultimately enabling them to uncover music they love.




## Technical Overview

### API Usage
test

### Matchmaking/Ranking Algorithm
test




