# Opus

## Introduction
Classical music is one of the richest and most rewarding musical genres to listen to, featuring a near endless selection of pieces hailing from distinct stylistic eras that span a combined several hundred years of history. However, it is this same reason that often makes it feel intimidating and unapproachable to newcomers, as there are just so many possible places to start.

_Opus is a music recommender that aims to introduce people to the world of classical piano through the use of an elo-based ranking system and dynamic matchmaking algorithm to run targeted head-to-head comparisons between different pieces and profile a user's tastes._

## Using Opus
When starting a test, users can choose between either an era or composer mode:

**Era Mode** - a 15 round comparison test identifies a user's preferences for the four major stylistic eras (baroque, classical, romantic, and modern)

**Composer Mode** - a 30 round comparison test identifies a user's preferences for eight significant composers (js bach, mozart, beethoven, chopin, liszt, rachmaninoff, scriabin, and debussy)

The comparison test for both modes will present two selected pieces each round alongside a 30-second preview of each, and prompt users to choose the one they prefer. For information on the internal logic of the matchmaking and ranking systems, see [Matchmaking/Ranking Algorithm](#matchmakingranking-algorithm).

At the end of the test, the top-ranked era(s) or composer(s) will be presented to the user as recommended starting points for listening.

<br>

https://github.com/user-attachments/assets/5e25e3ea-de52-465b-ba1d-cf6a6e374da5

<br>


**Limitations**

The A/B, sample-based testing methodology employed by Opus is inherently prone to inaccuracies, as it is impossible to form a complete opinion on a piece from a random 30-second clip (true for any genre, but especially so for classical, which is built on the idea of long-form consumption). Moreover, the algorithm may pair works of entirely different contexts with each other (i.e. one movement of a classical sonata vs a romantic lieder), making some comparisons inherently unfair. Consequently, results may be skewed in favor of eras or composers that do not best reflect the taste of the user.

Generally speaking, the composer test will provide a more consistent experience than its era counterpart, as it avoids the issue of large stylistic differences existing between composers categorized very broadly under one era (i.e. scriabin vs debussy under modern). However, it is also fundamentally limited in scope by the omission of many great composers for brevity.

Even with such limitations in mind, Opus can hopefully still prove valuable to complete newcomers to the world of classical music by acting as the guide that narrows their field of focus and directs their attention, ultimately helping them uncover music they love.

## Technical Specifications

### Matchmaking/Ranking Algorithm
_The core logic that powers Opus under-the-hood is built on two interconnected systems: an elo rating system and a probabilistic roulette wheel selection system._ [(Approach Explained)](#why-take-this-approach)

#### Elo rating system (Ranking)
The elo rating system is used to rank the relative positions of different eras or composers based on user selections.

At the start of a test, all competing categories are assigned base elo ratings of 1500, which are then updated round over round in zero-sum changes when a user picks their winner. In comparisons where the elo difference is large and the higher-rated category wins, the rating change on both sides will be marginal since the expected outcome occurred. However, if the lower-rated category wins, the subsequent changes will be much more substantial since the victory is considered an upset.

Expected/unexpected wins are dictated by a win probability variable calculated using the relative ratings of the opposing categories and the following formula:

$$
E_A = \frac{1}{1 + 10^{(R_B - R_A) / 400}}
$$

<sub>where $E_A$ is the probability (in decimal form) of opponent A defeating opponent B based on their respective ratings ($R_A$ & $R_B$)</sub>

<br>
Once an actual winner is crowned, the subsequent rating change is calculated using the winner's calculated probability of winning and the following formula:
<br><br>


```
winner rating change = K * (1 - win probability) | loser rating change = -(winner rating change)
```

<sub>where K=40 is the maximum number of points that can be won or lost in a single round</sub>

<br>

#### Roulette wheel selection system (Matchmaking)
The roulette wheel selection system is used to apply weighted probabilities (based on relative elo ratings) to the matchmaking process in place of random generation. 

At the start of a test, all competing categories are assigned equal probability weights that initially sum to 1.0, which like the elo ratings, are updated round over round when a winner is selected. The change in weight of the winning and losing category per round are proportional to the change in elo rating that occurs, divided by a constant value.

_In era mode, this constant is set to 400 for a max 0.1 increase/decrease in a single category's probability weight per round._

_In composer mode, this constant is set to 600 for a max 0.0667 increase/decrease in a single category's probability weight per round (increased round count in composer mode requires more gradual changes)._

In both modes, relative floors and ceilings are in place to prevent any category from ever being hidden entirely or developing a runaway lead in probability.

When determining the matchup for each round, a random number is first generated ranging from 0 to the sum of all the weights. The program then traverses through the categories and sums each weight as an individual slice until the number is 'captured' by one of them, which is chosen as the first contender. This process is repeated to determine the opposing category, with the omission of the selected category's weight from the competition pool.
<br><br>

``` js
function selectRandomWithProbability(possibleSelections: Category[]): Category {
    // ... omitted: calculation of probabilitySum - represents sum of the category weights in possibleSelections

    // generate a random number between 0 and probabilitySum
    const randomNum = Math.random() * probabilitySum;
    
    // traverse categories (eras/composers) array and sum weightings as individual slices until the randomly selected number is 'captured' by one of the categories  
    let cumulative = 0;
    
    for (const selection of possibleSelections) {
        cumulative += selection.probability; // add individual 'slices'
    
        if (randomNum <= cumulative) { // check if random num is captured by slice just added
            return selection;
        }
    }
}
```
<sub>ts implementation of the roulette wheel selection system</sub>

<br>
Under this model, higher rated categories are awarded with larger probability weights (slices) and are, in turn, more likely to be displayed. Conversely, lower rated categories receive smaller probability weights, lowering their likelihood of being shown.

#### Why take this approach?

The ultimate goal of the algorithm is to quickly profile a user's tastes and identify their most preferred eras/composers. To accomplish this, it prioritizes two objectives:

1. Identify and rank categories that users show interest in
2. Continuously re-evaluate top ranking categories to ensure consistency

For ranking, an elo-based system was specifically chosen in place of a conventional point-tally model given its self-correcting nature and ability to quantify the significance of individual user choices. 

These characteristics are especially significant to the function of the probabilistic matchmaking system, which is used to intentionally expose users more frequently to categories they have taken prior interest in. 

The model continuously stress-tests high ranking categories to prevent any one category from becoming top-ranked by chance, as it will be forced to repeatedly defend its position against lower-rated opponents.

In doing so, the algorithm simultaneously provides low ranking categories with frequent opportunities to mount potential comebacks during a test. With the weighting floor in place, the system ensures that such contenders still appear in comparisons, where they will be highly likely to face-off against a high ranking opponent. Given the self-correcting nature of the elo system, any category that wins one of these matchups in an upset will receive a significant boost in rating, and in turn, a proportionally significant gain in probabilistic weighting. This will increase the category's overall visibility and place it into subsequent matchups, where it will be forced to defend its position and justify the rating increase.

Under this system, no era/composer is ever truly eliminated from high-ranking contention while a test is ongoing, which is essential to mitigating two of the most pronounced limitations of the testing methodology itself:

1. Grouping unique pieces under collective categories
2. Random 30-second previews
  
The issue lies in the very strong possibility of 'false negatives', where users may not resonate with specific works of an era/composer, even if they have a preference towards that era/composer as a whole. Such cases can be triggered simply by subjectivity in taste, as well as by the preview track for a given piece misrepresenting the overall work and skewing the user's opinion.

For instance, if a user initially chooses against pieces pertaining to an era they are actually inclined to favour, a world in which it can recover in rating and end the test as a top-ranked preference is made entirely possible through self-correcting rankings. As previously explained, the era in question will continue to appear in future matchups, where it will likely trigger a large rating swing once it wins and thereby provide itself with subsequent opportunities to prove itself.

On the flip end, it is entirely possible for 'false positives' to occur, where a user resonates strongly with a specific work, but has adamant opinions regarding its corresponding era/composer as a whole. In such cases, the category will likely lose in subsequent matchups and fail to demonstrate consistent favourability, quickly dropping back down in both rating and visibility.

As such, the algorithm naturally prevents outlier pieces from exerting an outsized influence the final rankings, as it only rewards categories for being able to _consistently_ perform, while negating the impact of fluke wins and losses.



#### Note

The algorithm is specifically designed to identify a user's most preferred categories, however, it does so at the expense of an accurate ranking that features every category. 

By nature, rankings between midfield categories will be inaccurate since the algorithm is heavily biased towards matchups that feature at least one of the top contenders. Consequently, a comparison between, for instance, a 6th and 7th place category, will almost never occur, making it impossible to fairly rank them against each other. With this in mind, the composer test will only display the top four ranked composers on the results page.


### System Architecture

Opus implements a client-server architecture featuring a static frontend bundled by Vite and an Express.js backend.


#### Tech Stack
| Layer | Technologies |
|---|---|
| Frontend | `HTML5, CSS3, TypeScript, Vite` |
| Backend | `Node.js, Express.js, JavaScript` |
| Third-Party Integrations | `Deezer API, ColorThief` |
| Deployment | `Render` |


#### Frontend TS Modules

`interface.ts` - Per-page entry point: binds DOM events to application logic through an instance of the SessionManager class, linking user actions to test progression

`script.ts` - Implements the SessionManager class to store state data and control test progression; each class method corresponds to a user-driven event (starting/initializing, processing matchup results, ending)

`library.ts` - Builds objects pertaining to each composer & era using the Category class 

`logic.ts` - Matchmaking & ranking algorithm logic

`api.ts` - Communication with backend API routes

`ui.ts` - DOM rendering (displaying matchup/round info, final results)


#### Express Server

The backend is comprised of an Express.js server that serves the static frontend and proxies GET requests to the public Deezer API (no auth) to retrieve track metadata from curated playlists representing each category.

| Category | Playlist |
|---|---|
| Baroque | https://link.deezer.com/s/34bMMRXCn45BPl52sk6ml |
| Classical | https://link.deezer.com/s/34bMRE3mwi7wbZalqgNUc |
| Romantic | https://link.deezer.com/s/34bMS0XWrUbGUO2U5zAwd |
| Modern | https://link.deezer.com/s/34bK0UcD8VR55MHTyFxr8 |
| | |
| JS Bach | https://link.deezer.com/s/34bMSyqvZdq5fgK6dlxUi |
| Mozart | https://link.deezer.com/s/34bMT4y24E5WmarBcwCMF |
| Beethoven | https://link.deezer.com/s/34bMTlb4VRQMyyVQsSGVW |
| Chopin | https://link.deezer.com/s/34bMTFons9eEfUcDFhog9 |
| Liszt | https://link.deezer.com/s/34bMTWgDvvsM4ERdLdp8l |
| Rachmaninoff | https://link.deezer.com/s/34bMUbkizA3VTN4mnwD4u |
| Scriabin | https://link.deezer.com/s/34bMUrNZ9wUKeFT6tAPDa |
| Debussy | https://link.deezer.com/s/34bMUHBF4ROWXZ9ZK4Cqc |

ColorThief is also implemented to extract album colour palette data (used for dynamic theming) server-side, keeping the frontend independent of Node.js. 

