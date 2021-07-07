import chalk from 'chalk';
import config from 'config';
import { sanitize, validateMessage, registerComponents } from 'utils/discord';

/**
 * Handles Discord message events.
 */
const MessageEvent = {
  name: 'message',
  async execute(client, msg) {
    try {
      if (msg.author.bot) {
        // Is ephemeral message
        if (Object.values(msg.flags)[0] == 64) return;
        // Add '❌' reaction to mimic UX of ephemeral messages
        if (msg?.embeds[0]?.title == 'Error') await msg.react('❌');
        return;
      }
      if (!msg.content.startsWith(config.prefix)) return;

      const input = sanitize(msg.content);

      const options = input.substring(config.prefix.length).split(' ');
      const name = options.shift().toLowerCase();
      const command = client.commands.get(name);
      if (!command) return;

      const output = await command.execute({ ...client, options });
      if (!output) return;

      const data = validateMessage(output);
      const message = await client.api.channels(msg.channel.id).messages.post({ data });
      if (!data.components) return;

      return registerComponents(client, message.id, data.components);
    } catch (error) {
      console.error(chalk.white(`${chalk.yellow(`[events/message]`)}\n>> ${chalk.red(error.stack)}`));
    }
  },
};

export default MessageEvent;
