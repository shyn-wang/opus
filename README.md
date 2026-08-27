# Opus

## Introduction
Classical music is one of the richest and most rewarding musical genres to listen to, featuring a near-endless selection of pieces hailing from distinct stylistic eras that span a combined several hundred years of history. However, it is this same reason that often makes it feel intimidating and unapproachable to newcomers, as there are just so many possible places to start.

_Opus is a music recommender designed to introduce people to the world of classical piano through the use of an adaptive ranking and matchmaking algorithm that conducts A/B testing between different styles of pieces to profile a user's overall preferences._

## Using Opus
When starting a test, users can choose between either an era or composer mode:

**Era Mode** - a 15-round comparison test that profiles a user's preferences for the four major stylistic eras (baroque, classical, romantic, and modern)

**Composer Mode** - a 30-round comparison test that profiles a user's preferences for eight significant composers (js bach, mozart, beethoven, chopin, liszt, rachmaninoff, scriabin, and debussy)

The comparison test for both modes will present two selected pieces each round alongside a 30-second preview of each, and prompt users to select the one they prefer. For information on the internal logic of the matchmaking and ranking systems, see [Matchmaking/Ranking Algorithm](#matchmakingranking-algorithm).

At the end of the test, the top-ranked era(s) or composer(s) will be presented to the user as recommended starting points for listening.

<br>

https://github.com/user-attachments/assets/5e25e3ea-de52-465b-ba1d-cf6a6e374da5


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
The roulette wheel selection system is used to apply weighted probabilities (based on relative elo ratings) to the matchmaking process in place of purely random selection. 

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
<sub>typescript implementation of the roulette wheel selection system</sub>

<br>
Under this model, higher rated categories are awarded larger probability weights (slices) and, in turn, are more likely to be displayed. Conversely, lower rated categories receive smaller probability weights, lowering their likelihood of being shown.

#### Why take this approach?

The ultimate goal of the algorithm is to quickly profile a user's tastes and identify their most preferred eras or composers. To accomplish this, it prioritizes two objectives:

1. Identify and rank categories that users show interest in
2. Continuously re-evaluate high ranking categories to ensure consistency

For ranking, an elo-based system was specifically chosen in place of a conventional point-tally model given its self-correcting nature and ability to quantify the significance of individual user choices. 

These characteristics are especially significant to the function of the probabilistic matchmaking system, which adapts in real-time to intentionally expose users more frequently to categories they have previously shown interest in. 

The model continuously stress-tests high ranking categories to prevent any one category from becoming top-ranked by chance, as it will be forced to repeatedly defend its position against lower-rated opponents.

In doing so, the algorithm simultaneously provides low ranking categories with frequent opportunities to mount potential comebacks during a test. With the weighting floor in place, the system ensures that such contenders still appear in comparisons, where they will be highly likely to face-off against a high ranking opponent. Given the self-correcting nature of the elo system, any category that wins such a matchup in an upset will receive a significant boost in rating, and in turn, a proportionally significant gain in probabilistic weighting. This will increase the category's overall visibility and place it into subsequent matchups, where it will be forced to justify its rating increase and demonstrate consistent performance.

Given this, no era or composer is ever truly eliminated from high-ranking contention while a test is ongoing, which is essential to mitigating the single most pronounced limitation of the testing methodology itself: **noise**

#### Limitations

The algorithm is inherently prone to collecting noisy data as a result of numerous compounding factors:


1. `Random 30-second preview tracks`
   
   Each round relies on a decision being made between two pieces based solely on 30-second audio samples, making it impossible for a comprehensive opinion to be formed on either work and leaving users with only an essence of what each has to offer. This would be problematic for any genre of music, but is especially so for classical, which is built on the notion of long-form consumption. Consequently, the random preview for a given work often misrepresents the character of the overall piece and alters how it is perceived by users.

2. `Unfair comparisons`

   The algorithm may pit works of entirely different contexts against each other (i.e. one movement of a classical sonata vs a romantic lied), making some comparisons inherently unfair and potentially inducing user bias.

   For instance, in a matchup between a fast and slow piece, a user may be intrinsically biased towards the faster work each time, regardless of the era or composer associated with it. In such cases, the principal factor motivating the user's decisions is no longer the style of a piece, but rather its form, making the results inaccurate.

3. `Grouping of distinct pieces under broad categories`

   The broad categorization of pieces from different composers (era mode) or distinct styles of pieces from the same composer (composer mode) inevitably introduces variability to a category's round over round performance.

   It is more than likely that a user will prefer one composer over another in a given era, or favour a specific style of piece from an individual composer (i.e. favouring chopin nocturnes over waltzes). As such, depending on which works are randomly selected to represent each category in a matchup, the user may have pre-existing biases that are likely to influence the outcome in unpredictable ways.

   For instance, if a user resonates strongly with the works of the majority of composers in a given era, it is naturally expected to rise towards the top in ranking, even if the user actively dislikes the remaining pieces. However, in the latter case, the era will likely exhibit random fluctuations (i.e. sudden dips) in rating over the course of a test, as different composers are selected to represent it and the minority of unfavoured works inevitably make appearances. 

    Generally speaking, the composer test will be more consistent in this regard than its era counterpart, as it avoids the issue of large stylistic differences between composers categorized very broadly under one era (i.e. scriabin & debussy both under modern). However, it is also fundamentally limited in scope by the omission of many great composers for brevity and does not eliminate the issue of categorization altogether.

<br>

All of these contributing factors work to skew user preferences in individual matchups against the predictions of the elo system. Consequently, they significantly <a href="#footnote" id="footnote-ref">increase</a> the likelihood of **fluke losses**, where users may not resonate with specific works of an era or composer, despite favouring that category as a whole, as well as **fluke wins**, where users may resonate strongly with a specific work, but are generally averse to its corresponding era/composer.

However, in both cases, the algorithm naturally prevents noisy data from exerting an outsized influence on the final rankings:

`Addressing fluke losses`

Given the self-correcting nature of the algorithm, even if a user chooses against an era or composer they are generally inclined to favour in numerous consecutive fluke matchups, the algorithm ensures it still has opportunities to recover in rating and end the test as a top-ranked preference. As previously explained, the category in question will continue to appear in future matchups, where an upset win is likely to trigger a large rating swing and thereby provide it with subsequent chances to prove itself.

In instances where fluke losses occur in isolated cases throughout a test for strongly preferred eras or composers, both the category's rating and probability weight are high enough such that the effects of individual losses (even upsets) are insignificant. 

`Addressing fluke wins`

Since the algorithm enforces consistent favourability as a requirement for becoming top-ranking, categories that win in fluke comparisons are likely to quickly drop back down in both rating and visibility (after the initial spike), as they will be unable to consistently win in following matchups.

<br>

<p id="footnote">
  <a href="#footnote-ref">^</a> 
  <em><sup>*</sup>Note that a baseline chance of fluke results is always present due to the inherent nature of subjective taste, regardless of the factors described above - categories may perform against expectations for no specific reason (true even in a hypothetical world where every piece in a given category is of identical style, comparisons are ideal, and audio samples are comprehensive)</em>
</p>


#### Ranking Accuracy

The algorithm is specifically designed to identify a user's most preferred categories, however, it does so at the expense of an accurate ranking that features every category. 

By nature, rankings between midfield categories will be inaccurate since the algorithm is heavily biased towards matchups that feature at least one of the top contenders. Consequently, a comparison between, for instance, a 6th and 7th place category, will almost never occur, making it impossible to fairly rank them against each other. With this in mind, the composer test will only display the _top three_ ranked composers on the results page.


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

<br>

ColorThief is also implemented to extract album colour palette data (used for dynamic theming) server-side, keeping the frontend independent of Node.js. 

