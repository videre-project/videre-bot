import chalk from 'chalk';

/**
 * Handles the bot's ready state.
 */
const MessageReactionAdd = {
  name: 'messageReactionAdd',
  async execute(client, reaction, user) {
    try {
      // Get original message context
      let msg = reaction.message;
      // Handle partial-emitted events
      if (!reaction.message.author) {
        msg = await client
          .channels.cache.get(msg.channelId)
          .messages.fetch(msg.id);
      }
      /**
       * Allow deleting error messages sent by the bot when reacting with the '❌' emoji.
       */
      if (
        // Message author is the bot AND reaction was not from the bot.
        (msg.author.id == client.user.id.toString()
          && user.id !== client.user.id)
        // Emoji reaction is the '❌' emoji with >= 2 reactions or by interacted user.
        && (reaction._emoji.name == '❌'
          || msg.interaction.user.id == user.id.toString()
          || reaction._emoji.reaction.count >= 2)
      ) {
        await client
          .channels.cache.get(msg.channelId)
          .messages.fetch(msg.id)
          .then(msg => msg.delete());
      }
    } catch (error) {
      console.error(
        chalk.white(`${chalk.yellow(`[events/messageReactionAdd]`)}\n>> ${chalk.red(error.stack)}`)
      );
    }
  },
};

export default MessageReactionAdd;