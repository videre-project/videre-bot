import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
import { MessagePayload } from 'discord.js';
import {
  EMBED_DEFAULTS,
  MESSAGE_LIMITS,
  MESSAGE_COMPONENT_TYPES,
  MESSAGE_COMPONENT_STYLES,
  INTERACTION_RESPONSE_FLAGS,
  COMMAND_OPTION_TYPES,
} from 'constants';

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

  if (typeof(message) == 'string') {
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
  } else return normalize(message);
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
 * Escapes characters to avoid Discord markdown formatting.
 */
export const markdownEscape = (text) => {
  return text.replace(/((\_|\*|\~|\`|\|){2})/g, '\\$1');
};

/**
 * Parses and validates keys against a types enum.
 */
export const validateKeys = (keys, types) =>
  Object.keys(keys).reduce((previous, key) => types[snakeCase(key)] || previous, null);

/**
 * Validates embed fields.
 */
export const validateFields = fields =>
  fields?.reduce((fields, { name, value, inline }, index) => {
    if (index < MESSAGE_LIMITS.FIELD_LENGTH)
      fields.push({
        name: name.slice(0, MESSAGE_LIMITS.FIELD_NAME_LENGTH),
        value: value.slice(0, MESSAGE_LIMITS.FIELD_VALUE_LENGTH),
        inline: Boolean(inline),
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
        validateKeys(rest, MESSAGE_COMPONENT_STYLES)
        || MESSAGE_COMPONENT_STYLES.SECONDARY,
      ...rest,
    })),
  },
];

/**
 * Validates a message object or response and its flags.
 */
export const validateMessage = message => {
  // No-op on empty or pre-processed message
  if (!message || message instanceof MessagePayload) return message;

  // Early return if evaluating message string
  if (typeof message === 'string')
    return { content: message.slice(0, MESSAGE_LIMITS.CONTENT_LENGTH) };

  // Handle message object and inline specifiers
  return {
    files: message.files,
    tts: Boolean(message.tts),
    flags: validateKeys(message.flags || message, INTERACTION_RESPONSE_FLAGS),
    components: message.components
      || (message.buttons?.length ? validateButtons(message.buttons) : null),
    content: message.content?.slice(0, MESSAGE_LIMITS.CONTENT_LENGTH) || null,
    // embed: message.content ? null : validateEmbed(message.embed || message),
    // embeds: message.content ? null : (message.embeds || [message]).map(validateEmbed),
    embed: !message.embed ? null : validateEmbed(message.embed || message),
    embeds: !message.embeds ? null : (message.embeds || [message]).map(validateEmbed),
    ephemeral: Boolean(message.ephemeral)
  };
};

/**
 * Validates human-readable command meta into a Discord-ready object.
 */
export const validateCommand = ({ name, description, options }) => ({
  name,
  description,
  options: options?.map(({ type, ...rest }) => ({
    type: COMMAND_OPTION_TYPES[snakeCase(type)],
    ...rest,
  })),
});

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
