# Opus

## Introduction
Classical music is one of the richest and most rewarding musical genres to listen to, featuring a near endless selection of pieces hailing from distinct stylistic eras that span a combined several hundred years of history. However, it is this same reason that often makes it feel intimidating and unapproachable to newcomers, as there are so many possible places to start.

_Opus is a music recommender that aims to introduce people to the world of classical piano through the use of an elo-based ranking system and dynamic matchmaking algorithm to run targeted head-to-head comparisons between different pieces and profile a user's tastes._

## Using Opus
When starting a test, users can choose between either an era or composer mode:

**Era Mode** - a 15 round comparison test identifies a user's preferences for the four major stylistic eras (baroque, classical, romantic, and modern)

**Composer Mode** - a 30 round comparison test identifies a user's preferences for eight significant composers (js bach, mozart, beethoven, chopin, liszt, rachmaninoff, scriabin, and debussy)

The comparison test for both modes will present two selected pieces each round alongside a 30-second preview of each, and prompt users to choose the one they prefer. For information on the internal logic of the matchmaking and ranking systems, see [Matchmaking/Ranking Algorithm](#matchmakingranking-algorithm).

At the end of the test, the top-ranked era(s) or composer(s) will be presented to the user as recommended starting points for listening.

-insert demo gif-
<br><br>


**Limitations**

The A/B, sample-based testing methodology employed by Opus is inherently prone to inaccuracies, as it is impossible to form a complete opinion on a piece from a random 30-second clip (true for any genre, but especially so for classical, which is built on the idea of long-form consumption). Moreover, the algorithm may pair works of entirely different contexts with each other (i.e. one movement of a classical sonata vs a romantic lieder), making some comparisons inherently unfair. Consequently, results may be skewed in favor of eras or composers that do not best reflect the taste of the user.

Generally speaking, the composer test will provide a more consistent experience than its era counterpart, as it avoids the issue of large stylistic differences existing between composers categorized very broadly under one era (i.e. scriabin vs debussy under modern). However, it is also fundamentally limited in scope by the omission of many great composers for brevity.

Even with such limitations in mind, Opus can hopefully still prove valuable to complete newcomers to the world of classical music by acting as the guide that narrows their field of focus and directs their attention, ultimately helping them uncover music they love.

## Technical Specifications

### API Usage
Opus communicates with the publicly accessible Deezer API (no authentication required) via GET requests to retrieve track data from curated composer and era specific playlists.

### Matchmaking/Ranking Algorithm
_The core logic that powers Opus under-the-hood is built on two interconnected systems: an elo rating system and a probabilistic roulette wheel selection system._

#### Elo rating system (Ranking)
The elo rating system is used to rank the relative positions of different eras or composers based on user selections.

At the start of a test, all competing categories are assigned base elo ratings of 1500, which are then updated round over round in zero-sum changes when a user picks their winner. In comparisons where the elo difference is large and the higher-rated category wins, the rating change on both sides will be marginal since the expected outcome occurred. However, if the lower-rated category wins, the subsequent changes will be much more substantial since the victory is considered an upset.

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

<sub>where K=40 is the maximum number of points that can be won or lost in a single round</sub>

<br>

_An elo-based system was specifically chosen in place of a conventional point-tally model for its dynamic handling of rating changes and self-correcting nature, both of which power the [probabilistic matchmaking algorithm](#roulette-wheel-selection-system-matchmaking). Under this system, no era/composer is ever truly eliminated from high-ranking contention while a test is ongoing._

For instance, if a user initially chooses against pieces pertaining to a specific era, but is later shown a work they love matched against a high-ranking opponent, picking the lower-rated era provides it with an <ins>opportunity</ins> (see roulette wheel selection breakdown) to recover in ranking and end the test as one of the user's top-ranked preferences. This prevents outlier pieces from drastically hurting an otherwise favoured category, rewarding overall consistency.

#### Roulette wheel selection system (Matchmaking)
The roulette wheel selection system is used to apply weighted probabilities (based on relative elo ratings) to the matchmaking process in place of random generation. 

At the start of a test, all competing categories are assigned equal probability weights that initially sum to 1.0, which like the elo ratings, are updated round over round when winners are selected. The change in the probabilities of the winning and losing category per round are proportional to the change in elo rating that occurs, divided by a constant value.

In era mode, this constant is set to 400 for a max 0.1 increase/decrease in a single category's probability weight per round.

In composer mode, this constant is set to 600 for a max 0.0667 increase/decrease in a single category's probability weight per round (increased round count in composer mode calls for more gradual changes in probability).

In both modes, relative floors and ceilings are in place to prevent any category from ever being hidden entirely or developing a runaway lead in probability.

When determining the matchup for each round, a random number is generated ranging from 0 to the sum of all the competing weights; the program then traverses through the categories and adds the weightings of each as individual slices until the number is 'captured' by one of them, which is chosen as the first contender. This process is repeated to determine the opposing category, with the omission of the selected category's weight from the competition pool.
<br><br>

<img width="2720" height="880" alt="weighted_probability_selection" src="https://github.com/user-attachments/assets/e36a8dda-ee31-4c6a-810b-4544645d4a33" />
<sub>visual representation of the probability weights as 'slices' in era mode</sub>

<br><br>
_Under this model, higher rated categories are awarded with larger probability weights (slices) and are, in turn, more likely to be displayed. Conversely, lower rated categories are given smaller probability weights, reducing their likelihood of being shown._

This intentionally exposes users more often to categories they have taken interest in, and stress-tests the leaders by pitting them against a wide range of competing options. Doing so _rewards categories that are consistently rated highly_ and prevents any one category from becoming top-ranked per a fluke, as it will be forced to repeatedly defend its position against lower-rated opponents.

With the weighting floor in place, the system also ensures that low-ranking categories are still provided opportunities to appear in matchups and potentially mount comebacks. Any category that wins in an upset against a higher-rated opponent will receive a significant weighting boost proportional to its elo gain, increasing overall visibility and forcing it into more matchups to test if it can defend its position and justify the jump in rating.

**Note**

The probabilistic matchmaking system is specifically designed to identify a user's most preferred categories, however, it does so at the expense of an accurate ranking that includes every category. 

By nature, rankings between midfield categories will be inaccurate since the algorithm is heavily biased towards matchups that feature at least one of the top contenders. Consequently, a comparison between, for instance, a 6th and 7th place category, will almost never occur, making it impossible to rank them against each other. With this in mind, the composer test will only display the top four ranked composers on the results page.

