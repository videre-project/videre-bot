import chalk from 'chalk';
import config from 'config';
import { validateMessage } from 'utils/discord';
import { extractURL } from 'utils/deckURL';

/**
 * Handles the bot's ready state.
 */
const MessageReactionAdd = {
  name: 'messageReactionAdd',
  async execute(client, reaction_orig, user) {
    const [reactionUser] = reaction_orig.users.cache.values();
    try {
        /**
         * Allow deleting error messages sent by the bot when reacting to the '❌' emoji.
         */
        if (
          // Message author is the bot AND user is not the bot.
          (reaction_orig.message.author.id == client.user.id.toString() && user.id !== client.user.id) &&
          // Emoji reaction is the '❌' emoji AND was added by the bot.
          ((reaction_orig._emoji.name == '❌' && reactionUser.id == client.user.id) ||
          // Override if reaction is from a whitelisted user OR '❌' reaction count reaches 3 or greater.
          [...config.adminUsers].includes(user.id.toString()) || reaction_orig._emoji.reaction.count >= 3)
        ) {
          await client.channels
            .cache.get(reaction_orig.message.channel.id)
            .messages.fetch(reaction_orig.message.id)
            .then(msg => msg.delete());
        /**
         * Suggest visual decklist command when deck url is posted.
         */
        } else if (
          // Check if message author is the user who reacted.
          reaction_orig.message.author.id.toString() == user.id.toString() &&
          // Emoji reaction is the '🔎' emoji AND was added by the bot.
          ((reaction_orig._emoji.name == '🔎' && reactionUser.id == client.user.id) ||
          // Override if reaction is from a whitelisted user OR '❌' reaction count reaches 3 or greater.
          [...config.adminUsers].includes(user.id.toString()) || reaction_orig._emoji.reaction.count >= 3)
        ) {
          await client.channels
            .cache.get(reaction_orig.message.channel.id)
            .messages.fetch(reaction_orig.message.id)
            .then(async msg => {
              await msg.react('⌛');
              await msg.reactions.cache.get('🔎').remove();
            });

          const url = extractURL(reaction_orig.message.content);
          const output = await client
            .commands.get('decklist')
            .execute({ client, args: { /** metaOnly: true, */ decklist_url: url } });

          await client.channels
            .cache.get(reaction_orig.message.channel.id)
            .messages.fetch(reaction_orig.message.id)
            .then(async msg => await msg
              .reactions.cache.get('⌛')
              .remove()
            );

          await client.channels
            .cache.get(reaction_orig.message.channel.id)
            .messages.fetch(reaction_orig.message.id)
            .then(async message => {
              if (!reaction_orig.message.deleted) {
                // await client.api.channels
                //   [reaction_orig.message.channel.id]
                //   .messages.post({
                //     data: {
                //       ...validateMessage({ ...output, color: 0x049ef4 }),
                //       allowedMentions: { repliedUser: false },
                //       message_reference: {
                //         message_id: reaction_orig.message.id,
                //         guild_id: reaction_orig.message.guild.id,
                //         channel_id: reaction_orig.message.channel.id
                //       }
                //     }
                //   });
                await message.reply({
                  // content: 'test',
                  embed: { ...output, color: 0x049ef4 },
                  allowedMentions: { repliedUser: false },
                  // message_reference: {
                  //   message_id: reaction_orig.message.id,
                  //   guild_id: reaction_orig.message.guild.id,
                  //   channel_id: reaction_orig.message.channel.id
                  // }
                });
              }
            });
        }
    } catch (error) {
      console.error(chalk.white(`${chalk.yellow(`[events/messageReactionAdd]`)}\n>> ${chalk.red(error.stack)}`));
    }
  },
};

export default MessageReactionAdd;
