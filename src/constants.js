import { Intents, MessageButton } from 'discord.js';
/**
 * Magic: The Gathering Online supported formats, sanctioned event types, colors, card types, etc.
 */
export const MTGO = {
  EVENT_TYPES: [
    { name: 'Leagues', value: 'league' },
    { name: 'Preliminaries', value: 'preliminary' },
    { name: 'Challenges', value: 'challenge' },
    { name: 'Premiers', value: 'premier' },
  ],
};

export const UNICODE = {
  ZERO_WIDTH: "\u200B",
  SPACE: "\u3000",
}

/**
 * Default bot intents and permission scopes.
 */
export const CLIENT_INTENTS = [
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MESSAGES,
  Intents.FLAGS.GUILD_MESSAGE_REACTIONS
];

/**
 * Embed default properties.
 */
export const EMBED_DEFAULTS = {
  color: 0x049ef4,
};

/**
 * Error Embed default properties.
 */
export const ERROR_DEFAULTS = {
  title: "Error",
  color: 0xe74c3c,
  ephemeral: true,
};

export const x_button = (label, hide_emoji = false) =>
  label
    ? (hide_emoji
      ? new MessageButton()
          .setStyle('DANGER')
          .setLabel(label)
          .setCustomId('x_button')
      : new MessageButton()
        .setStyle('DANGER')
        .setLabel(label)
        .setCustomId('x_button')
        .setEmoji('924339575248289886'))
    : new MessageButton()
      .setStyle('DANGER')
      .setCustomId('x_button')
      .setEmoji('924339575248289886');


/**
 * Creates a state-agnostic Error message.
 * @param {String} message Error message to display.
 * @param {Object} interaction Discord interaction object.
 * @returns {Object} Message object
 */
export const ERROR_MESSAGE = (description, error, interaction, verbose) => {
  if (error && Boolean(verbose)) {
    // Split error stack by line
    const stack = error.stack.split('\n');
    // Get first and last line of stack trace.
    const line_1 = stack[1].split('/');
    const line_n = stack[stack.length - 1].split('/');
    // Format lines into minified stack trace block.
    description = [
      description,
      '```bash',
      `${error.name}: ${error.message}`,
      line_1[0] + line_1.slice(-1),
      // Only show last line if non-duplicate.
      ...(line_1 !== line_n
        ? [
          // Get indentation.
          line_1[0].split('at')[0] + '...',
          line_n[0] + line_n.slice(-1)
        ] : []),
      '```'
    ].filter(Boolean)
    .join('\n');
  }
  return {
    embeds: [{ ...ERROR_DEFAULTS, description }],
    components: [],
    ephemeral: true,
    deferred: interaction?.deferred
  }
}

/**
 * Discord-enforced message character and size limits.
 */
export const MESSAGE_LIMITS = {
  CONTENT_LENGTH: 2000,
  TITLE_LENGTH: 256,
  DESC_LENGTH: 2048,
  FIELD_LENGTH: 25,
  FIELD_NAME_LENGTH: 256,
  FIELD_VALUE_LENGTH: 1024,
  BUTTON_LABEL_LENGTH: 80,
};

/**
 * Discord message component types.
 */
export const MESSAGE_COMPONENT_TYPES = {
  /**
   * A container for other components.
   */
  ACTION_ROW: 1,
  /**
   * A clickable button.
   */
  BUTTON: 2,
};

/**
 * Discord message component styles.
 */
export const MESSAGE_COMPONENT_STYLES = {
  /**
   * Blurple button. Requires `custom_id` to be specified.
   */
  PRIMARY: 1,
  /**
   * Grey button. Requires `custom_id` to be specified.
   */
  SECONDARY: 2,
  /**
   * Green button. Requires `custom_id` to be specified.
   */
  SUCCESS: 3,
  /**
   * Red button. Requires `custom_id` to be specified.
   */
  DANGER: 4,
  /**
   * Grey link button. Requires `url` to be specified.
   */
  LINK: 5,
};

/**
 * Flags that can be included in an Interaction Response.
 */
export const INTERACTION_RESPONSE_FLAGS = {
  /**
   * Show the message only to the user that performed the interaction. Message
   * does not persist between sessions.
   */
  EPHEMERAL: 64, // 1 << 6
};

/**
 * Valid option `type` values.
 */
export const COMMAND_OPTION_TYPES = {
  SUB_COMMAND: 1,
  SUB_COMMAND_GROUP: 2,
  STRING: 3,
  INTEGER: 4,
  BOOLEAN: 5,
  USER: 6,
  CHANNEL: 7,
  ROLE: 8,
};
