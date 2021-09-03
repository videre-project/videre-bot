import chalk from 'chalk';
import config from 'config';
import { sanitize, validateMessage, registerComponents } from 'utils/discord';
import { extractURL } from 'utils/deckURL';

/**
 * Handles Discord message events.
 */
const MessageEvent = {
  name: 'message',
  async execute(client, msg) {
    try {
      if (msg?.deleted === true) return;
      if (msg.author.bot) {
        // Is ephemeral
        if (Object.values(msg?.flags)[0] == 64) return;
        // Is deferred
        if (msg.content == '' && !msg.embeds.length) {
          // Perform exponential back-off
          for (let i = 1; i <= 10; i++) {
            const _i = parseInt(((((15 * 60) ** (1 / 10)) ** i) * 1000).toFixed(2)) - 974;
            await new Promise(res => setTimeout(res, _i));
            const channel = await client.channels.fetch(msg.channel.id);
            const _msg = await channel.messages.fetch(msg.id);
            if (_msg?.deleted === true) return;
            if (_msg?.embeds[0]?.title == 'Error') {
              await msg.react('❌'); return;
            } else if (_msg?.embeds[0]) return;
          }
        }
        // Is normal
        if (msg?.embeds[0]?.title == 'Error') {
          await msg.react('❌'); return;
        }
      }
      // React to decklist urls.
      // if (
      //   /(https?:\/\/[^\s]+)/g.test(msg.content) &&
      //   extractURL(msg.content)?.length
      // ) {
      //   await msg.react('🔎'); return;
      // }
      // Shadow Discord PacmanBruh
      if (msg.author.id == '670265902750760960') {
        await msg.react('thePAC:701276499403079720');
        await msg.react('PacManBruh:664698406056493066');
        await msg.react('PacBro:820366679685988412');
        // const data = validateMessage({
        //   content: 'https://media.discordapp.net/attachments/616419097969950744/787685900640714752/787677902816411649.gif'
        // });
        // await client.api.channels(msg.channel.id).messages.post({ data });
        return;
      }
      if (!msg.content.startsWith(config.prefix)) return;
      return;

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
