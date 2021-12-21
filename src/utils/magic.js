import { MTGO } from 'constants';
import { createCanvas, loadImage} from 'canvas';
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
 * Gets unique colors in a scryfall collection.
 */
export const getColors = (collection, emojiGuild) => {
  // Get unique colors for each card (or each card face)
  const data = collection.map(({ name, image_uris, colors, card_faces }, i) => {
    // Exclude companion colors
    if (MTGO.COMPANIONS.includes(name)) return [ 'C' ];
    return image_uris ? (!colors.length ? [ 'C' ] : colors) : [
    ...(!card_faces[0].colors.length) ? [ 'C' ] : card_faces[0].colors,
    ...(!card_faces[1].colors.length) ? [ 'C' ] : card_faces[1].colors
    ].filter((item, pos, self) => self.indexOf(item) == pos)
  }).flat(1);

  // Remove duplicates from set
  let colorsArray = [...new Set(
      data.filter(function(item, pos) {
      return data;
      // Only keep colors that occur more than once
      // return data.indexOf(item) !== data.lastIndexOf(item);
      }).flat(1)
  )];

  // Remove colorless symbol from array if other colors are present
  if (colorsArray.includes('C') && colorsArray.length > 1) colorsArray = colorsArray.filter(item => item !== 'C')

  // Sort mana by positional indexes for sorting in WUBRG order and format as {W}{U}{B}{R}{G}
  colorsArray = colorsArray.map(c => MTGO.COLORS.indexOf(c)).sort();
  const colors = manamoji(emojiGuild, `{${colorsArray.map(i => MTGO.COLORS[i]).join('}{')}}`);

  return colors;
}

/**
 * Formats MTGO Event urls to prettified event name.
 */
 export const formatEvent = function(url, uid, date) {
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
        (new Date(date
          .split('/')
          .map((s) => parseInt(s))
          .join('/')
        )).toDateString()
          .split(' ')
          .slice(0, -1)
          .map((s) => isNaN(s) ? s : getNumberWithOrdinal(parseInt(s)))
          .join(', ')
          .replace(/, ([^,]*)$/, ' $1')
    })`;
};

/**
 * Formats Scryfall collection and decklist object into sorted array / embed fields.
 */
export const formatDeck = function(json, deck, emojiGuild, mode) {
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
  let array = [];
  [ 'Companion', ...MTGO.CARD_TYPES, 'Sideboard' ].forEach((type) => {
    if (data.some(card => card.display_type == type)) {
      const subsetData = groupedData.get(type)
        .map(({ color_identity, colors, ...rest }, i) => {
          return {
            colors: colors.map(c => MTGO.COLORS.indexOf(c)),
            color_identity: color_identity.map(c => MTGO.COLORS.indexOf(c)),
            ...rest
          };
        })
        // Sorting Method 1
        .sort(dynamicSortMultiple('cmc', 'colors', '-qty', 'color_identity', 'name'))
        // Scryfall Sorting Method
        // .sort(dynamicSortMultiple('cmc', 'name'))
        .map(({ colors, color_identity, ...rest }) => {
          return {
            colors: `{${colors.map(i => MTGO.COLORS[i]).join('}{')}}`,
            color_identity: `{${color_identity.map(i => MTGO.COLORS[i]).join('}{')}}`,
            ...rest
          };
        })
      switch (mode) {
        case 'decklist':
          const subsetSum = Array.from(subsetData.reduce(
            (m, {display_type, qty}) => m.set(display_type, (m.get(display_type) || 0) + qty), new Map
          ), ([display_type, qty]) => qty);
          array.push({
            name: `${type == 'Sideboard' ? type : (type == 'Sorcery' ? 'Sorceries' : type + 's')} (${subsetSum})`,
            value: subsetData.map(({ qty, name }) => `**${qty}** ${name}`).join('\n'),
            inline: type == 'Land' || type == 'Sideboard' ? true : false
          });
          break;
        default:
          array = [...array, ...subsetData];
          break;
      }
    }
  });
  return array;
};

/**
 * Draw visual decklist from decklist object.
 * 
 * @example drawdeck({ mainboard: [{ qty: 4, name: "Island", image: "https://c1.scryfall...", ... }, ...], sideboard: [...] })
 * 
 */
export const drawDeck = async (decklist) => {
  const mainboardArray = decklist.filter(card => !(card.display_type == 'Companion' || card.display_type == 'Sideboard'));
  const sideboardArray = decklist.filter(card => (card.display_type == 'Companion' || card.display_type == 'Sideboard'));

  const numCols = mainboardArray.length >= 7 ? 7 : mainboardArray.length;
  const numRows = Math.ceil(mainboardArray.length / 7);

  const width = (
    // Horizontal padding
    (50 * 2) +
    // Total width of cards
    ((numCols + Math.ceil(sideboardArray.length / numRows)) * 223) +
    // Total gutter between cards
    (((numCols - 1) + (sideboardArray.length ? (Math.ceil(sideboardArray.length / numRows) - 1) : 0)) * 20)
    // Gutter between mainboard and sideboard
    + (sideboardArray.length ? 100 : 0)
  );

  const height = (
    // Vertical padding
    (50 * 2) +
    // Total height of cards
    (numRows * 311) +
    // Total gutter between cards
    ((numRows - 1) * 25)
  );

  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d', { alpha: false });

  // Speed optimizations
  context.quality = 'fast';
  context.textDrawingMode = 'glyph';

  // Background
  context.fillStyle = '#292B2F';//'#2F3136';
  context.fillRect(0, 0, width, height);

  // Fills rectangle with rounded corners.
  const roundRect = (context, x, y, w, h, r) => {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    context.beginPath();
    context.moveTo(x+r, y);
    context.arcTo(x+w, y,   x+w, y+h, r);
    context.arcTo(x+w, y+h, x,   y+h, r);
    context.arcTo(x,   y+h, x,   y,   r);
    context.arcTo(x,   y,   x+w, y,   r);
    context.closePath();
    context.fillStyle = '#1E1E1E';
    context.fill();
  }

  // Draw mainboard and sideboard image grid with qty labels
  await Promise.all(
    [...mainboardArray, ...sideboardArray].map( async (card, i) => {
      const _i = (i > mainboardArray.length - 1) ? i - mainboardArray.length : i;
      const _numCols = (i > mainboardArray.length - 1) ? Math.ceil(sideboardArray.length / numRows) : 7;
      const _mainboardWidth = (numCols * 223) + ((numCols - 1) * 20);

      let x_offset = 50 + ((_i % _numCols) * 223) + (((_i % _numCols) > 0) ? ((_i % _numCols) * 20) : (0));
      const y_offset = 50 + (Math.floor(_i / _numCols) * 331) + 5; // (Math.floor(i / 7) * 25);
      if (i > mainboardArray.length - 1) x_offset += 100 + _mainboardWidth;

      const cardImage = await loadImage(card.image);
      context.drawImage(cardImage, x_offset, y_offset, 223, 311);
      if (card.display_type == 'Companion') {
        const _cardImage = await loadImage('./bin/Companion_Frame.png');
        context.drawImage(_cardImage, x_offset, y_offset, 223, 311);
      }

      const font_offset = 5 + (`×${card.qty}`.length > 2 ? (`×${card.qty}`.length - 2) * 17 : 0);
      roundRect(context, x_offset + 150 - font_offset, y_offset + 41, 50 + font_offset, 50, 8);
      context.fillStyle = '#FFFFFF';
      context.font = 'bold 25px Verdana';
      context.fillText(`×${card.qty}`, x_offset + 156 - font_offset, y_offset + 74);
    })
  );
  
  const buffer = canvas.toBuffer('image/png');

  const max_dim = 1080 * 2;
  if (width > max_dim || height > max_dim) {
    const _width = width > max_dim ? max_dim : width / (height / max_dim);
    let _height = height > max_dim ? max_dim : height / (width / max_dim);
    if (width > max_dim && height > max_dim) _height = height / (width / max_dim);

    const _canvas = createCanvas(_width, _height);
    const _context = _canvas.getContext('2d', { alpha: false });

    // Background
    _context.fillStyle = '#2F3136';
    _context.fillRect(0, 0, _width, _height);

    const image = await loadImage(buffer);
    _context.drawImage(image, 0, 0, _width, _height);

    return _canvas.toBuffer('image/png');
  }

  return buffer;
}

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
