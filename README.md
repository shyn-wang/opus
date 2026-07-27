# Opus

## Introduction
Classical music is one of the richest and most rewarding musical genres to listen to, featuring of a near endless selection of pieces hailing from distinct stylistic eras that span a combined several hundred years of history. However, it is for this same reason that it can often feel intimidating and unapproachable for newcomers, as there are simply so many possible places to start.

_Opus is a music recommender that aims to introduce people to the world of classical piano through the use of an elo-based ranking system and dynamic matchmaking algorithm to run targeted head-to-head comparisons between different pieces and profile a user's tastes._

## How it Works
When using Opus, users can choose between either an era or composer mode:

**Era Mode** - a 15 round comparison test identifies a user's preferences for the four major stylistic eras (baroque, classical, romantic, and modern)

**Composer Mode** - a 30 round comparison test identifies a user's preferences for eight significant composers (js bach, mozart, beethoven, chopin, liszt, rachmaninoff, scriabin, and debussy)

The comparison test for both modes will present two selected pieces each round alongside a 30-second preview of each, and prompt users to choose the one they prefer. For information on the internal logic of the matchmaking and ranking systems, see [matchmaking algorithm](#matchmakingranking-algorithm).

At the end of the test, the top-ranked era(s) or composer(s) will be presented to the user as recommended starting points for listening.

-insert demo gif-
<br><br>


**Limitations**

The head-to-head, sample-based testing methodology employed by Opus is inherently prone to inaccuracies, as it is impossible to form a complete opinion on a piece from a random 30-second clip (true for any genre, but especially so for classical, which is built on the idea of long-form consumption). Moreover, the algorithm may pair works of entirely different contexts with each other (i.e. one movement of a classical sonata vs a romantic lieder), making some comparisons inherently unfair. Consequently, results may be skewed in favor of eras or composers that do not best reflect the taste of the user.

Generally speaking, the composer test will provide a more consistent experience than its era counterpart, as it avoids the issue of large stylistic differences existing between composers categorized very broadly under one era (i.e. scriabin vs debussy under modern). However, it is also fundamentally limited in scope by the omission of many key composers for brevity.

Even with such limitations in mind, Opus can hopefully still prove valuable to complete newcomers to the world of classical music by acting as the guide that narrows their field of focus and directs their attention, ultimately helping them uncover music they love.

## Technical Specifications

### API Usage
Opus communicates with the publicly accessible Deezer API (no authentication required) via GET requests to retrieve track data from curated composer and era specific playlists.

### Matchmaking/Ranking Algorithm
_The core logic that powers Opus under-the-hood is built on two interconnected systems: an elo rating system and a probabilistic roulette-wheel selection system._

#### Elo rating system
The elo rating system is used to rank the relative positions of different eras or composers based on user selections. At the start of a test, all competing categories are assigned base elo ratings of 1500, which are then updated round over round in zero-sum changes when a user picks their winner.

_An elo-based system was specifically chosen in place of a conventional point tally model for its dynamic handling of rating changes._

In comparisons where the elo difference is large and the higher-rated category wins, the rating change on both sides will be marginal since the expected outcome occurred. However, if the lower-rated category wins, the subsequent changes will be much more substantial since the victory is considered an upset.

Expected/unexpected wins are dictated by a win probability variable calculated using the relative ratings of the opposing categories and the following formula:

$$
E_A = \frac{1}{1 + 10^{(R_B - R_A) / 400}}
$$

<sub>where $E_A$ is the probability (in decimal form) of opponent A defeating opponent B based on their respective ratings ($R_A$ & $R_B$)</sub>

<br>
Once an actual winner is declared, the subsequent rating change is calculated using the winner's calculated probability of winning and the following formula:
<br><br>


```
winner rating change = K * (1 - win probability) | loser rating change = -(winner rating change)
```

<sub>where K is the maximum number of points that can be won or lost in a single round</sub>

<br>

_With dynamic rating changes in effect, no era or composer is ever truly eliminated from high-ranking contention while a test is ongoing..._




#### Roulette wheel selection system




