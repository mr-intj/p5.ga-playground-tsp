/**
 * Represents a population of individuals (at some generation).
 */
class Population {
    /**
     * Initializes a new Population instance
     *
     * @param {Number} populationSize - number of individuals in a generation. Must be 2 or greater.
     * @param {Number} numAllels - sequence size (e.g. 5 = [0, 1, 2, 3, 4]). Must be 2 or greater.
     */
    constructor(populationSize, numAllels) {
        console.assert(populationSize >= 2, `populationSize (${populationSize}) is less than two`);
        console.assert(numAllels >= 2, `numAllels (${numAllels}) is less than two`);

        this.generation = 1;
        this.individuals = [];

        for (let i = 0; i < populationSize; i++) {
            this.individuals[i] = new Individual(numAllels);
        }
    }

    /**
     * Create a new generation of individuals from the (evaluated) current generation
     *
     * @param {Number} newPopulationSize - number of individuals in next generation. Must be 2 or greater.
     * @param {number} mutationRate - probability of a mutation for each new child (0..1)
     */
    selection(newPopulationSize, mutationRate) {
        const matingPool = [];
        const nextGeneration = [];
        for (let candidate of this.individuals) {
            // console.assert(candidate.fitness >= 0 && candidate.fitness <= 1)

            // Ensure we always carry one copy of the best solution (unmodified) into the next generation
            // (this prevents backsliding)
            if (!nextGeneration[0] || candidate.fitness > nextGeneration[0].fitness) {
                nextGeneration[0] = candidate;
            }

            for (let i = 0, j = candidate.fitness * 100; i < j; i++) {
                matingPool.push(candidate);
            }
        }

        shuffle(matingPool, true);

        for (let i = 1; i < newPopulationSize; i++) {
            const parent1 = matingPool.pop();
            let child;
            if (floor(random(1.0 / mutationRate)) === 1) {
                child = new Individual(0);
                child.alleles = parent1.alleles.slice(0);
                child.mutate();
            } else {
                const parent2 = matingPool.pop();
                child = parent1.crossover(parent2);
            }
            nextGeneration[i] = child;
        }

        this.individuals = nextGeneration;
        this.generation++;
    }
}