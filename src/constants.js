import { Intents } from 'discord.js';

/**
 * Magic: The Gathering Online supported formats, sanctioned event types, colors, card types, etc.
 */
 export const MTGO = {
  FORMATS: [
    { name: 'Standard', value: 'standard' },
    { name: 'Pioneer', value: 'pioneer' },
    { name: 'Modern', value: 'modern' },
    { name: 'Legacy', value: 'legacy' },
    { name: 'Vintage', value: 'vintage' },
    { name: 'Pauper', value: 'pauper' },
  ],
  EVENT_TYPES: [
    { name: 'Leagues', value: 'league' },
    { name: 'Preliminaries', value: 'preliminary' },
    { name: 'Challenges', value: 'challenge' },
    { name: 'Premiers', value: 'premier' },
  ],
  // EVENT_TYPES = [
  //   'mocs',
  //   'preliminary',
  //   'challenge',
  //   'champs',
  //   'premier',
  //   'super-qualifier',
  //   'players-tour-qualifier',
  //   'showcase-challenge',
  // ],
  COLORS: ['C', 'W', 'U', 'B', 'R', 'G'],
  CARD_TYPES: ['Creature', 'Planeswalker', 'Artifact', 'Enchantment', 'Instant', 'Sorcery', 'Land'],
  COMPANIONS: [
    'Gyruda, Doom of Depths',
    'Jegantha, the Wellspring',
    'Kaheera, the Orphanguard',
    'Keruga, the Macrosage',
    'Lurrus of the Dream-Den',
    'Lutri, the Spellchaser',
    'Obosh, the Preypiercer',
    'Umori, the Collector',
    'Yorion, Sky Nomad',
    'Zirda, the Dawnwaker',
  ]
};

/**
 * Default bot intents and permission scopes.
 */
export const CLIENT_INTENTS = [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES];

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
 * The type of interaction this request is.
 */
export const INTERACTION_TYPE = {
  /**
   * A ping.
   */
  PING: 1,
  /**
   * A command invocation.
   */
  APPLICATION_COMMAND: 2,
  /**
   * A button interaction.
   */
  BUTTON: 3,
};

/**
 * The type of response that is being sent.
 */
export const INTERACTION_RESPONSE_TYPE = {
  /**
   * Acknowledge a `PING`.
   */
  PONG: 1,
  /**
   * Respond with a message, showing the user's input.
   */
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  /**
   * Acknowledge a command without sending a message, showing the user's input. Requires follow-up.
   */
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  /**
   * For components, ACK an interaction and edit the original message later; the user does not see a loading state.
   */
  DEFERRED_UPDATE_MESSAGE: 6,
  /**
   * For components, edit the message the component was attached to.
   */
  UPDATE_MESSAGE: 7,
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
