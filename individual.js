/**
 * Represents a single individual in a population.
 *
 * Each individual represents a possible solution,
 * and will be evaluated and assigned a path length
 * (i.e. "distance") and a normalized relative fitness
 * between 0.0 and 1.0.
 */
class Individual {
    /**
     * Initializes a new Individual instance
     *
     * @param {Number} numAllels - sequence size (e.g. 5 = [0, 1, 2, 3, 4]). Must be 2 or greater,
     *                             or zero if you plan to add alleles manually after construction.
     */
    constructor(numAllels) {
        console.assert(numAllels === 0 || numAllels >= 2, `numAllels (${numAllels}) is less than two`);

        this.fitness = 0;
        this.distance = Infinity;

        // Create an array of ascending values [0..(seqLength-1)]
        this.alleles = [];
        for (let i = 0, j = Math.floor(numAllels); i < j; i++) {
            this.alleles[i] = i;
        }

        shuffle(this.alleles, true);
    }

    /**
     * "Order 1" Crossover
     *  // TODO - implement Edge Recombination as an alternative
     *
     * @param {Individual} parent2
     */
    crossover(parent2) {
        // Select a random swath of consecutive alleles from Parent 1 (this),
        // and copy it (at the same position) to Child
        //
        // Parent 1:  8 4 7 3 6 2 5 1 9 0
        // Parent 2:  0 1 2 3 4 5 6 7 8 9
        //                  v v v v v
        // Child:     - - - 3 6 2 5 1 - -
        const swathBegin = Math.floor(random(this.alleles.length - 2));
        const swathEnd = Math.floor(swathBegin + 2, random(this.alleles.length));

        // console.assert(swathBegin < swathEnd);
        // console.assert(Math.abs(swathBegin - swathEnd) > 1);
        // console.assert(swathEnd < this.alleles.length);

        const childAlleles = [];
        const usedAlleles = new Map();
        for (let i = swathBegin; i <= swathEnd; i++) {
            childAlleles[i] = this.alleles[i];
            usedAlleles.set(this.alleles[i]);
        }

        // Copy alleles (in order) from Parent 2 to Child,
        // skipping any that were in the swath copied from Parent 1
        //
        // Parent 1:  - - - 3 6 2 5 1 - -
        // Parent 2:  0 - - - 4 - - 7 8 9
        //            v v v           v v
        // Child:     0 4 7 3 6 2 5 1 8 9
        for (let i = 0, j = 0, k = this.alleles.length; i < k; i++) {
            if (i < swathBegin || i > swathEnd) {
                while (usedAlleles.has(parent2.alleles[j])) {
                    j++;
                }
                childAlleles[i] = parent2.alleles[j++];
            }
        }

        const child = new Individual(0);
        child.alleles = childAlleles;
        return child;
    }

    /**
     * Mutate this individual
     */
    mutate() {
        const r = random();

        if (r < 0.43) {
            // Insertion (aka 'move')
            const removeAt = Math.floor(random(this.alleles.length));
            const insertAt = Math.floor(random(this.alleles.length));

            this.alleles.splice(insertAt, 0, this.alleles.splice(removeAt, 1)[0]);
        } else if (r < 0.86) {
            // Single Swap
            const i = Math.floor(random(this.alleles.length));
            const j = Math.floor(random(this.alleles.length));

            [this.alleles[i], this.alleles[j]] = [this.alleles[j], this.alleles[i]];
        } else if (r < 0.92) {
            // Partial Inversion
            const begin = Math.floor(random(this.alleles.length - 2));
            const end = Math.floor(begin + 2, random(this.alleles.length));

            this.alleles.splice(begin, 0, ...this.alleles.splice(begin, (end - begin) + 1).reverse());
        } else if (r < 0.98) {
            // Roll
            if (random() < 0.5) {
                do {
                    this.alleles.push(this.alleles.shift()); // roll right
                } while (random() < 0.5);
            } else {
                do {
                    this.alleles.unshift(this.alleles.pop()); // roll left
                } while (random() < 0.5);
            }
        } else if (r < 0.99) {
            // Full Inversion
            this.alleles.reverse();
        } else {
            // Scramble
            shuffle(this.alleles, true);
        }
    }
}