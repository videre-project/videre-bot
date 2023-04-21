/**
 * Formats bracketed mana symbols into Discord emojis
 * 
 * @example manamoji(client, "{W}{R}")
 * @example manamoji(client, "{G/P}")
 * @example manamoji(client, "{X}{X}")
 * 
 * Adapted from:
 * https://github.com/scryfall/servo/blob/master/lib/middleware/manamoji.js
 */
export function manamoji(client, string) {
  let substitutions = {};
  
  //manually

  let COLORS = ['W', 'U', 'B', 'R', 'G'];
  let NUMBERS = [...Array(16).keys()];
  let ADDTL = ['P', 'C', 'E', 'T', 'Q', 'S', 'X', 'Y', 'Z'];
  
  function _(before, after) {
    if (typeof after === 'undefined') after = before;
    substitutions[`{${before}}`] = `mana${after.toString().toLowerCase()}`;
  }
  
  ADDTL.forEach(a => { _(a) });
  NUMBERS.forEach(n => { _(n) });
  COLORS.forEach(c => { _(c) });
  COLORS.forEach(c => { _(`2/${c}`, `2${c}`) });
  COLORS.forEach(c => { _(`${c}/P`, `${c}p`) });
  COLORS.forEach(c => { COLORS.forEach(d => {
    if (c != d) {
      // Add hybrid mana symbols
      _(`${c}/${d}`, `${c}${d}`);
      // Add phyrexian hybrid mana symbols
      _(`${c}/${d}/P`, `${c}${d}p`);
    }
  }) });

  const re = new RegExp(Object.keys(substitutions).map(v => 
    v.replace('{', '\\{').replace('}', '\\}')).join('|'),'gi');
  return string.replace(re, matched => {
    const emoji = client.emojis?.cache?.find(
      emoji => emoji.name === substitutions[matched]
    );
    return emoji ? emoji.toString() : matched;
  });
}

export default manamoji;