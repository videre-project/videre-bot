import { MTGO } from 'constants';
import { groupBy, dynamicSortMultiple } from 'utils/database';

/**
 * Converts an integer to an ordinal.
 */
 export function getNumberWithOrdinal(n) {
  let s = ["th", "st", "nd", "rd"],
      v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Formats MTGO Event urls to prettified event name.
 */
 export const formatEvent = function(url, uid) {
  return `${
    url.toLowerCase()
      .split("https://magic.wizards.com/en/articles/archive/mtgo-standings/")[1]
      .replace(/[0-9]/g, '')
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
      .join(' ')
      .replace(/\s\s+/g, ' ')
      .trim()
    } #${uid} (${
        (new Date(url.toLowerCase()
          .split("https://magic.wizards.com/en/articles/archive/mtgo-standings/")[1]
          .replace(/[A-Za-z]/g, '')
          .replace(/^-+/gm, '')
          .replace(/-/g, '/')
          .split('/')
          .map((s) => parseInt(s))
          .join('/')
          .match(/(?<=\/).*/g)
          +'/0')
        ).toDateString()
          .split(' ')
          .slice(1, -1)
          .map((s) => isNaN(s) ? s : getNumberWithOrdinal(s))
          .join(' ')
    })`;
};

/**
 * Formats Scryfall collection and deck object into embed fields.
 */
export const formatDeck = function(json, deck, emojiGuild) {
  const data = json.map(({ name, color_identity, cmc, image_uris, colors, type_line, mana_cost, card_faces, layout }, i) => {
    let front_face_props = [];
    switch(image_uris) {
      // Get properties of front face for double-sided or split cards
      case undefined:
        front_face_props = {
          image: card_faces[0].image_uris.png,
          colors: [
            ...(!card_faces[0].colors.length) ? [ 'C' ] : card_faces[0].colors,
            ...(!card_faces[1].colors.length) ? [ 'C' ] : card_faces[1].colors
          ].filter((item, pos, self) => self.indexOf(item) == pos),
          display_type: card_faces[0].type_line,
        };
        break;
      default:
        front_face_props = {
          image: image_uris.png,
          colors: (!colors.length) ? [ 'C' ] : colors,
          display_type: type_line
        };
        break;
    }

    MTGO.CARD_TYPES.forEach((type) => {
      if (i + 1 > deck.mainboard.length) {
        if (MTGO.COMPANIONS.includes(name)) {
          front_face_props.display_type = 'Companion';
        } else front_face_props.display_type = 'Sideboard';
      } else if (front_face_props.display_type.includes('Land')) {
        front_face_props.display_type = 'Land';
      } else if (front_face_props.display_type.includes(type)) {
        front_face_props.display_type = type;
      }
    });

    // if (mana_cost) {
    //   const _mana_cost = manamoji(emojiGuild, mana_cost);
    //   front_face_props.mana_cost = layout !== 'split' ? _mana_cost.split('//')[0] : _mana_cost;
    // }

    return {
      name: layout !== 'split' ? name.split('//')[0] : name,
      qty: [ ...deck.mainboard, ...deck.sideboard ][i].quantity,
      color_identity: (!color_identity.length) ? [ 'C' ] : color_identity,
      cmc: cmc,
      ...front_face_props
    };
  });
  
  const groupedData = groupBy(data, card => card.display_type);
  let fields = [];
  [ ...MTGO.CARD_TYPES, 'Companion', 'Sideboard' ].forEach((type) => {
    if (data.some(card => card.display_type == type)) {
      const subsetData = groupedData.get(type)
        .map(({ color_identity, colors, ...rest }, i) => {
          return {
            colors: colors.map(c => MTGO.COLORS.indexOf(c)),
            color_identity: color_identity.map(c => MTGO.COLORS.indexOf(c)),
            ...rest
          };
        })
        .sort(dynamicSortMultiple('cmc', 'colors', '-qty', 'color_identity', 'name'))
        .map(({ colors, color_identity, ...rest }) => {
          return {
            colors: `{${colors.map(i => MTGO.COLORS[i]).join('}{')}}`,
            color_identity: `{${color_identity.map(i => MTGO.COLORS[i]).join('}{')}}`,
            ...rest
          };
        })
      const subsetSum = Array.from(subsetData.reduce(
        (m, {display_type, qty}) => m.set(display_type, (m.get(display_type) || 0) + qty), new Map
      ), ([display_type, qty]) => qty);
      fields.push({
        name: `${type == 'Sideboard' ? type : (type == 'Sorcery' ? 'Sorceries' : type + 's')} (${subsetSum})`,
        value: subsetData.map(({ qty, name }) => `**${qty}** ${name}`).join('\n')
      });
    }
  });
  return fields;
};

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
  
    let COLORS = ['W', 'U', 'B', 'R', 'G'];
    let NUMBERS = [...Array(16).keys()];
    let ADDTL = ['C', 'E', 'T', 'Q', 'S', 'X', 'Y', 'Z'];
    
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
      if (c != d) _(`${c}/${d}`, `${c}${d}`);
    }) });
  
    const re = new RegExp(Object.keys(substitutions).map(v => 
      v.replace('{', '\\{').replace('}', '\\}')).join('|'),'gi');
    return string.replace(re, matched => {
      const emoji = client.emojis.cache?.find(
        emoji => emoji.name === substitutions[matched]
      );
      return emoji ? emoji.toString() : matched;
    });
  }
