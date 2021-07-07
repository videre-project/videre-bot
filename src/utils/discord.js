import fetch from "node-fetch";
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
import {
  EMBED_DEFAULTS,
  MESSAGE_LIMITS,
  MESSAGE_COMPONENT_TYPES,
  MESSAGE_COMPONENT_STYLES,
  INTERACTION_RESPONSE_FLAGS,
  COMMAND_OPTION_TYPES,
  MTGO,
} from 'constants';
import { APIMessage, MessageAttachment } from 'discord.js';
import { formatDeck, drawDeck, manamoji } from 'utils/magic';

// Shared sanitation context
const { window } = new JSDOM('');
const DOMPurify = createDOMPurify(window);

/**
 * Normalizes and cleans up unsafe strings, eval.
 */
export const normalize = string => DOMPurify.sanitize(string);

/**
 * Sanitizes Discord syntax from command arguments.
 */
export const sanitize = message => {
  if (!message) return;

  return normalize(
    message
      // Remove newline characters
      .replace(/\n/gm, ' ')
      // Remove mentions
      .replace(/<@!\d*>/g, '')
      // Remove formatting
      .replace(/(\*|`|:)*/g, '')
      // Trim inline spaces
      .replace(/\s+/g, ' ')
      .trim()
  );
};

/**
 * Escapes characters to avoid Discord markdown formatting.
 */
export const markdownEscape = function(text) {
  return text.replace(/((\_|\*|\~|\`|\|){2})/g, '\\$1');
};

/**
 * Converts a vanilla or camelCase string to SNAKE_CASE.
 */
export const snakeCase = string =>
  string
    .replace(/[A-Z]/g, char => `_${char}`)
    .replace(/\s+|_+/g, '_')
    .toUpperCase();

/**
 * Parses and validates keys against a types enum.
 */
export const validateKeys = (keys, types) =>
  Object.keys(keys).reduce((previous, key) => types[snakeCase(key)] || previous, null);

/**
 * Validates embed fields.
 */
export const validateFields = fields =>
  fields?.reduce((fields, { name, value, ...rest }, index) => {
    if (index < MESSAGE_LIMITS.FIELD_LENGTH)
      fields.push({
        name: name.slice(0, MESSAGE_LIMITS.FIELD_NAME_LENGTH),
        value: value.slice(0, MESSAGE_LIMITS.FIELD_VALUE_LENGTH),
        ...rest,
      });

    return fields;
  }, []);

/**
 * Validates and generates an embed with default properties.
 */
export const validateEmbed = ({ title, description, fields, ...rest }) => ({
  ...EMBED_DEFAULTS,
  title: title?.slice(0, MESSAGE_LIMITS.TITLE_LENGTH),
  description: description?.slice(0, MESSAGE_LIMITS.DESC_LENGTH),
  fields: validateFields(fields),
  ...rest,
});

/**
 * Parses and validates message button components.
 */
export const validateButtons = buttons => [
  {
    type: MESSAGE_COMPONENT_TYPES.ACTION_ROW,
    components: buttons.map(({ label, ...rest }, index) => ({
      type: MESSAGE_COMPONENT_TYPES.BUTTON,
      custom_id: `button-${index + 1}`,
      label: label?.slice(0, MESSAGE_LIMITS.BUTTON_LABEL_LENGTH),
      style:
        validateKeys(rest, MESSAGE_COMPONENT_STYLES) ||
        MESSAGE_COMPONENT_STYLES.SECONDARY,
      ...rest,
    })),
  },
];

/**
 * Validates a message object or response and its flags.
 */
export const validateMessage = message => {
  // No-op on empty or pre-processed message
  if (!message || message instanceof APIMessage) return message;

  // Early return if evaluating message string
  if (typeof message === 'string')
    return { content: message.slice(0, MESSAGE_LIMITS.CONTENT_LENGTH) };

  // Handle message object and inline specifiers
  return {
    files: message.files,
    tts: Boolean(message.tts),
    flags: validateKeys(message.flags || message, INTERACTION_RESPONSE_FLAGS),
    components: message.buttons?.length ? validateButtons(message.buttons) : null,
    content: message.content?.slice(0, MESSAGE_LIMITS.CONTENT_LENGTH) || '',
    embed: message.content ? null : validateEmbed(message.embed || message),
    embeds: message.content ? null : [message.embeds || message].map(validateEmbed),
  };
};

/**
 * Validates human-readable command meta into a Discord-ready object.
 */
export const validateCommand = ({ name, description, options }) => ({
  name,
  description,
  options: options?.map(({ type, ...rest }) => ({
    type: isNaN(type) ? COMMAND_OPTION_TYPES[snakeCase(type)] : type,
    ...rest,
  })),
});

/**
 * Formats an array of items/embed properties/embeds or decklist into an embed with navigable pages.
 */
 export const formatListAsPages = async (items, message, page = 0, length = 10, mode) => {
  // Deal with inconsistent handling of object arrays
  if (!Array.isArray(items) && length > 1) items = [items];
  // Format items into pages of 'length'
  const pages = items.reduce((output, item, index) => {
    const pageIndex = Math.trunc(index / length);
    if (mode) {
      if (mode == 'description' && typeof(items[0]) == 'string') {
        const line = `\n${item}`;
        if (output[pageIndex]) output[pageIndex] += line;
        else output[pageIndex] = message?.description ? `${message.description}${line}` : line;
      } 
      else if ((mode == 'fields' || mode == 'decklist' || mode == 'visual_decklist') && typeof(items[0]) == 'object') {
        if (output[pageIndex]) output[pageIndex].push(item);
        else output[pageIndex] = [item];
      }
    }
    else {
      if (output[pageIndex]) output[pageIndex].push(item);
      else output[pageIndex] = [item];
    }
    return output;
  }, []);

  // Return a message with updated props
  const updateMessage = async () => {
    if (mode == 'decklist' || mode == 'visual_decklist' && length == 1) {
      if (pages[page][0]?.deck && pages[page][0]?.emojiGuild) {
        const collection = await fetch("https://api.scryfall.com/cards/collection", {
          method: "post",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "identifiers": [
              ...pages[page][0].deck.mainboard.map(({ cardName }) => ({ "name": cardName.split('/')[0] })),
              ...pages[page][0].deck.sideboard.map(({ cardName }) => ({ "name": cardName.split('/')[0] })),
            ],
          }),
        }).then(res => res.json())
        
        // Get unique colors for each card (and card face)
        const data = collection.data.map(({ image_uris, colors, card_faces }, i) => 
          image_uris ? (!colors.length ? [ 'C' ] : colors) : [
            ...(!card_faces[0].colors.length) ? [ 'C' ] : card_faces[0].colors,
            ...(!card_faces[1].colors.length) ? [ 'C' ] : card_faces[1].colors
          ]
          // Remove duplicate colors
          .filter((item, pos, self) => self.indexOf(item) == pos)
        // Flatten nested arrays of colors from each card into a single array
        ).flat(1);

        // Only keep colors that occur more than once
        let colorsArray = [...new Set(
          data.filter(function(item, pos) {
            return data.indexOf(item) !== data.lastIndexOf(item);
          }).flat(1)
        )];
        // Remove colorless symbol from array if other colors are present
        if (colorsArray.includes('C') && colorsArray.length > 1) colorsArray = colorsArray.filter(item => item !== 'C')
        // Sort mana by positional indexes for sorting in WUBRG order and format as {W}{U}{B}{R}{G}
        colorsArray = colorsArray.map(c => MTGO.COLORS.indexOf(c)).sort();
        const colors = manamoji(pages[page][0]?.emojiGuild, `{${colorsArray.map(i => MTGO.COLORS[i]).join('}{')}}`);

        // Add deck colors and handle missing archetype names
        pages[page][0].title = pages[page][0].title
          .replace('\n', `\n${colors} `)
          .replace('**undefined**', `**Unknown**`);
        
        const decklist = formatDeck(collection.data, pages[page][0].deck, pages[page][0]?.emojiGuild, mode);
        if (mode == 'decklist') {
          pages[page][0].fields = pages[page][0]?.fields ? [...pages[page][0].fields, ...decklist] : decklist;
        } else if (mode == 'visual_decklist') {
          const buffer = await drawDeck(decklist);
          pages[page][0].image = { url: 'attachment://canvas.png' };
          pages[page][0].files = [new MessageAttachment(buffer, 'canvas.png')];
        }
        if (pages[page][0]?.deck) delete pages[page][0].deck;
        if (pages[page][0]?.emojiGuild) delete pages[page][0].emojiGuild;
      } else if (!pages[page][0]?.fields) {
        throw new Error([
          'No ',
          !pages[page][0]?.deck ? 'deck object' : '',
          !pages[page][0]?.deck && !pages[page][0]?.emojiGuild ? ' or ' : '',
          !pages[page][0]?.emojiGuild ? 'emojiGuild' : '',
          ' found.'
        ].join(''));
      }
    }
    else if (mode) message[mode] = pages[page];

    let pageMessage = {
      ...message,
      footer: { text: `Page ${page + 1} of ${pages.length}` },
    };

    let pageProps = {};
    if (!Array.isArray(items[0]) && typeof(items[0]) == 'object') {
      Object.getOwnPropertyNames(pages[page][0]).forEach((prop) => {
        pageProps[prop] = pages[page][0][prop];
      });
    }
    else if (typeof(items[0]) == 'object') pageProps = pages[page][0];

    return { ...pageProps, ...pageMessage }
  };

  // Format message buttons with pages
  return {
  ...(await updateMessage()),
  buttons:
    pages.length > 1 &&
    [
      {
        label: '<<',
        update: () => (page = 0),
      },
      {
        label: '← Back',
        update: () => page > 0 && page--,
      },
      {
        label: 'Next →',
        update: () => page < pages.length - 1 && page++,
      },
      {
        label: '>>',
        update: () => (page = pages.length - 1),
      },
    ].map(({ label, update }) => ({
      label,
      onClick: async () => {
        update();
        return await updateMessage();
      },
    })),
  };
};

/**
 * Registers component event handlers.
 */
export const registerComponents = (client, parentId, components) => {
  const [buttons] = components;

  buttons.components.forEach(button => {
    const listenerId = `${parentId}-${button.custom_id}`;
    client.listeners.set(listenerId, button.onClick);
  });
};
