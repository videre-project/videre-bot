export * from './decks';
export * from './events';
export * from './manamoji';
export * from './visual-decklist';

const cardPrices_path = './src/utils/magic/cardPrices.py';

/**
 * Wrapper for cardPrices.py python script.
 * @param {*} Obj Parameter Object
 * @param {string} Obj.cardname Cardname.
 * @param {string} Obj.set Set name to find prices for.
 * @example
 * const output = await cardPrices({ cardname: 'Forest', set: 'ORI' })
 *  .then(res => JSON.parse(res.toString())); // -> {object}
 * @returns {object} { graph: base64 image, url: {string} }
 */
export const cardPrices = async ({ cardname, set }) => 
  await require("child_process")
    .execSync([
      `python3 ${cardPrices_path}`,
      ...[
        { flag: 'cardname', value: cardname },
        { flag: 'set',      value: set      }
      ].map(({ flag, value }) => `--${flag} "${value}"`)
    ].join(' '));
