// import chalk from 'chalk';
import { formatListAsPages } from 'utils/discord';

const Hypergeo = {
  name: 'hypergeo',
  description: "Solves a hypergeometric distribution.",
  type: 'global',
  options: [
    {
      name: 'pop_size',
      description: 'The size of the population that is being sampled from.',
      type: 'integer',
    },
    {
      name: 'pop_successes',
      description: 'The number of successes within the population.',
      type: 'integer',
    },
    {
      name: 'sample_size',
      description: 'The size of the sample you take from the entire population.',
      type: 'integer',
    },
    {
      name: 'desired_successes',
      description: 'The amount of successes you are looking for from your sample.',
      type: 'integer',
    },
  ],
  execute({ args }) {
    try {
      // Calculates the greatest common denominator between two numbers
      function gcd(givenNumber1, givenNumber2) {
        let greatestCommonDenominator = 1; // Any two numbers' minimum gcd is 1

        for (let i = 1; i <= givenNumber1 && i <= givenNumber2; i++) {
          // Checks if i is factor of both integers using modulus division
          if (givenNumber1 % i == 0 && givenNumber2 % i == 0)
            greatestCommonDenominator = i;
        }

        return greatestCommonDenominator;
      }

      /*
       * Calculates a combination of n and r
       * The equation for nCr is (n!) / ((r!) * (n - r)!)
       * This can be simplified to n * (n - 1) * (n - 2) * ... * (n - r + 1) / r!
       * This method calculates nCr using this simplified equation
       * Within a Deck object, n = sampleSize and r = desiredSuccesses
       */
      function ncr(n, r) {
        /*
         * The combination of n and r is equal to the combination of n and (n - r)
         * For example, 17 combination 13 is the same as 17 combination 4
         * Therefore, we can substitute (n - r) for r if we have a larger r value
         * Attempting to prevent overflow, if (n - r) is less than r we use it instead
         */
        if (n - r < r) r = n - r;

        // Tries to calculate the combination of n and r
        try {
          let top = 1; // top holds the value of n * (n - 1) * (n - 2) ...
          let bottom = 1; // bottom holds the value of r * (r - 1) * (r - 2) ...

          if (r) {
            /*
             * Because this only loops until r = 0, we only calculate the first r numbers of the factorial
             * This is equivalent to the n * (n - 1) * (n - 2) * ... * (n - r + 1)
             * In other words, it is a reduced factorial of n from n to n - r + 1
             * This is how we calculate nCr with the simplified equation
             * The top is n * (n - 1) * (n - 2) * ... * (n - r + 1) and the bottom is r!
             */
            while (r) {
              top *= n;
              bottom *= r;

              let greatestCommonDenominator = gcd(top, bottom);

              // Divides the top and bottom of the fraction by their gcd to help prevent overflow
              top /= greatestCommonDenominator;
              bottom /= greatestCommonDenominator;

              n--;
              r--;
            }
          }
          else top = 1; // n combination 0, where n is any number, is always equal to 1

          /*
           * A factorial always simplifies to a whole number
           * Therefore, we can just return the top, because using the gcd division, bottom should simplify to 1
           * In the case where r = 0, we simply store 1 in top because n combination 0 is always 1
           */
          return top;
        }
        // There was a divide-by-zero error
        catch(err) {
          return 1; // Returns a default value of 1
        }
      }

      // Class specification for a Deck object
      class Deck {
        // Constructor for a Deck object, with default values of all zero
        constructor(popSize = 0, popSuccesses = 0, sampleSize = 0, desiredSuccesses = 0) {
          // Checks if the numbers they entered allow for a valid Deck
          if (popSize >= popSuccesses && popSize >= sampleSize && popSize >= desiredSuccesses
            && popSuccesses >= desiredSuccesses && sampleSize >= desiredSuccesses
            && popSize >= 0 && popSuccesses >= 0 && sampleSize >= 0 && desiredSuccesses >= 0
          ) {
            try {
              this.popSize = popSize; // The size of the population that is being sampled from
              this.popSuccesses = popSuccesses; // The number of successes within the population
              this.sampleSize = sampleSize; // The size of the sample you take from the entire population
              this.desiredSuccesses = desiredSuccesses; // The amount of successes you are looking for from your sample
              this.popFailures = popSize - popSuccesses;

              this.exactChance = this.probability(this.desiredSuccesses);
              this.orGreaterInclusiveChance = this.orGreater(this.exactChance);
              this.orLessInclusiveChance = this.orLess(this.exactChance);
            }
            // It is possible to construct a valid Deck that still results in a divide-by-zero error
            catch(err) {
              this.constructorFailure();
            }
          }
          else this.constructorFailure();
        }

        // The numbers the user entered failed to construct a valid Deck object
        constructorFailure() {
          // Set all variables equal to 0
          this.popSize = 0;
          this.popSuccesses = 0;
          this.sampleSize = 0;
          this.desiredSuccesses = 0;
          this.popFailures = 0;
          this.exactChance = 0;
          this.orGreaterInclusiveChance = 0;
          this.orLessInclusiveChance = 0;
        }

        // Calculates the hypergeometric probability
        probability(currentDesiredSuccesses) {
          // Local variables are used so the member variables of the class are not changed
          let localPopSize = this.popSize;
          let localPopSuccesses = this.popSuccesses;
          let localPopFailures = this.popFailures;
          let sampleFailures = this.sampleSize - currentDesiredSuccesses;

          let prob = 1;
          let combination = ncr(this.sampleSize, currentDesiredSuccesses);

          // Calculate the probability from the successes
          while (currentDesiredSuccesses > 0) {
            prob *= (localPopSuccesses / localPopSize);
            localPopSuccesses--;
            localPopSize--;
            currentDesiredSuccesses--;
          }

          // Calculate the probability from the failures
          while (sampleFailures > 0) {
            prob *= (localPopFailures / localPopSize);
            localPopFailures--;
            localPopSize--;
            sampleFailures--;
          }

          return prob * combination;
        }

        // Calculates the probability of n or greater successes
        orGreater(exactChance) {
          let tempDesiredSuccesses = this.desiredSuccesses;

          while (tempDesiredSuccesses < this.sampleSize) {
            tempDesiredSuccesses++;
            exactChance += this.probability(tempDesiredSuccesses);
          }

          return exactChance;
        }

        // Calculates the probability of n or less successes
        orLess(exactChance) {
          let tempDesiredSuccesses = this.desiredSuccesses;

          while (tempDesiredSuccesses > 0) {
            tempDesiredSuccesses--;
            exactChance += this.probability(tempDesiredSuccesses);
          }

          return exactChance;
        }

        // The following six methods are getters for class variables
        get exact() { return this.exactChance; }
        get orGreaterInclusive() { return this.orGreaterInclusiveChance; }
        get orLessInclusive() { return this.orLessInclusiveChance; }
      }

      // Array that contains the user's input from the document
      let userInputs = [
        (args?.pop_size ? args?.pop_size : 0),
        (args?.pop_successes ? args?.pop_successes : 0),
        (args?.sample_size ? args?.sample_size : 0),
        (args?.desired_successes ? args?.desired_successes : 0)
      ];

      // Construct a Deck object from the user's input
      let deck = new Deck(userInputs[0], userInputs[1], userInputs[2], userInputs[3]);

      return formatListAsPages(
        [
          {
            name: 'Chance of exactly desired successes',
            value: `**P(X = x):** ${(deck.exact*100).toFixed(2)}%`,
          },
          {
            name: 'Chance of less than desired successes',
            value: `**P(X < x):** ${((deck.orLessInclusive - deck.exact)*100).toFixed(2)}%`,
          },
          {
            name: 'Chance of desired successes or less',
            value: `**P(X __<__ x):** ${(deck.orLessInclusive*100).toFixed(2)}%`,
          },
          {
            name: 'Chance of greater than desired successes',
            value: `**P(X > x):** ${((deck.orGreaterInclusive - deck.exact)*100).toFixed(2)}%`,
          },
          {
            name: 'Chance of desired successes or greater',
            value: `**P(X __>__ x):** ${((deck.orGreaterInclusive)*100).toFixed(2)}%`
          },
        ],
        { title: 'Hypergeo', description: `**N =** ${userInputs[0]}, **k =** ${userInputs[1]}, **n =** ${userInputs[2]}, **x =** ${userInputs[3]}` },
        0, 1, 'fields'
      );

      return {
        title: 'Hypergeo',
        description: `**N =** ${userInputs[0]}, **k =** ${userInputs[1]}, **n =** ${userInputs[2]}, **x =** ${userInputs[3]}`,
        fields: [
          {
            name: 'Chance of exactly desired successes',
            value: `**P(X = x):** ${(deck.exact*100).toFixed(2)}%`,
          },
          {
            name: 'Chance of less than desired successes',
            value: `**P(X < x):** ${((deck.orLessInclusive - deck.exact)*100).toFixed(2)}%`,
          },
          {
            name: 'Chance of desired successes or less',
            value: `**P(X __<__ x):** ${(deck.orLessInclusive*100).toFixed(2)}%`,
          },
          {
            name: 'Chance of greater than desired successes',
            value: `**P(X > x):** ${((deck.orGreaterInclusive - deck.exact)*100).toFixed(2)}%`,
          },
          {
            name: 'Chance of desired successes or greater',
            value: `**P(X __>__ x):** ${((deck.orGreaterInclusive)*100).toFixed(2)}%`
          },
        ],
      };
    } catch (error) {
      // console.error(
      //   chalk.cyan(`[/hypergeo]`)+
      //   chalk.grey('\n>> ') + chalk.red(`Error: ${error.message}`)
      // );
      return {
        title: 'Error',
        description: error.message,
        color: 0xe74c3c,
        ephemeral: true,
      };
    }
  },
};

export default Hypergeo;
