/**
 * Represents a Traveling Salesman Problem; a set of cities randomly placed on a grid.
 */
class Problem {
    static get MIN_SEPARATION() { return 40; } // Separation (in pixels) between cities
    static get WIDTH() { return 1000; }
    static get HEIGHT() { return 1000; }

    /**
     * Initializes a new Problem instance
     *
     * @param {Number} numCities - Number of cities. Must be 2 or greater.
     */
    constructor(numCities) {
        console.assert(numCities >= 2, `numCities (${numCities}) is less than two`);

        this.minDistance = Number.MAX_VALUE; // Lower bound of path length in all generations so far
        this.maxDistance = Number.MIN_VALUE; // Upper bound of path length in all generations so far
        this.bestSolution; // Best solution (Individual) of all generations so far
        this.history = []; // History of shortest path length (Number) for all generations [0..(N-1)] so far

        // Randomly generate a list of cities
        this.cities = [];
        for (let i = 0; i < numCities; i++) {
            // Generate a new city location, ensuring that it's not too close to an existing city
            let x, y;
            let minSeparation = Problem.MIN_SEPARATION;
            const timeLimit = millis() + 100;
            do {
                x = Math.floor(random(Problem.WIDTH));
                y = Math.floor(random(Problem.HEIGHT));

                if (millis() > timeLimit) {
                    minSeparation--;
                    if (minSeparation === 0) {
                        break;
                    }
                }
            } while (this.cities.some(city => dist(city.x, city.y, x, y) < minSeparation));
            this.cities[i] = createVector(x, y);
        }
    }

    /**
     * Evaluate the fitness of an array of individuals (shorter paths are considered more fit than longer paths).
     *
     * @param {Individual[]} individuals - an array of Individual instances
     */
    evaluate(individuals) {
        // Upper and lower bounds for this generation only
        let lowerBound = Number.MAX_VALUE;
        let upperBound = Number.MIN_VALUE;
        for (let candidate of individuals) {
            let totalDistance = 0.0;
            let lastCityIdx = -1;
            for (let cityIdx of candidate.alleles) {
                if (lastCityIdx >= 0) {
                    let fromCity, toCity;
                    if (lastCityIdx < cityIdx) {
                        fromCity = this.cities[lastCityIdx];
                        toCity = this.cities[cityIdx];
                    } else {
                        fromCity = this.cities[cityIdx];
                        toCity = this.cities[lastCityIdx];
                    }
                    totalDistance += dist(fromCity.x, fromCity.y, toCity.x, toCity.y);
                }
                lastCityIdx = cityIdx;
            }

            candidate.distance = totalDistance;

            if (totalDistance < lowerBound) {
                lowerBound = totalDistance;
                this.bestSolution = candidate;
            }

            if (totalDistance > upperBound) {
                upperBound = totalDistance;
            }
        }

        // Normalize distance to 0..1 as fitness
        const isValidRange = (lowerBound < upperBound);
        for (let candidate of individuals) {
            candidate.fitness = isValidRange
                ? 1.0 - norm(candidate.distance, lowerBound, upperBound)
                : 1.0;
            // console.assert(!isNaN(candidate.fitness))
        }

        this.history.push(this.bestSolution.distance);

        // Keep track of all-time lower and upper bounds
        if (this.bestSolution.distance < this.minDistance) {
            this.minDistance = this.bestSolution.distance;
        }

        if (this.bestSolution.distance > this.maxDistance) {
            this.maxDistance = this.bestSolution.distance;
        }
    }
}