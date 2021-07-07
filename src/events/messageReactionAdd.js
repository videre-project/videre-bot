import chalk from 'chalk';
import config from 'config';

/**
 * Handles the bot's ready state.
 */
const MessageReactionAdd = {
  name: 'messageReactionAdd',
  async execute(client, reaction_orig, user) {
    const [reactionUser] = reaction_orig.users.cache.values();
    try {
        /**
         * Allow deleting error messages sent by the bot when reacting to the '❌' emoji
         */
        if (
            // Message author is the bot AND user is not the bot
            (reaction_orig.message.author.id == client.user.id.toString() && user.id !== client.user.id) &&
            // Emoji reaction is the '❌' emoji AND was added by the bot
            ((reaction_orig._emoji.name == '❌' && reactionUser.id == client.user.id) ||
            // Override if reaction is from a whitelisted user OR '❌' reaction count reaches 3 or greater
            [...config.adminUsers].includes(user.id.toString()) || reaction_orig._emoji.reaction.count >= 3)
        ) {
            await client.channels
                .cache.get(reaction_orig.message.channel.id)
                .messages.fetch(reaction_orig.message.channel.lastMessageID)
                .then(message => message.delete());
        }
    } catch (error) {
      console.error(chalk.white(`${chalk.yellow(`[events/messageReactionAdd]`)}\n>> ${chalk.red(error.stack)}`));
    }
  },
};

export default MessageReactionAdd;
