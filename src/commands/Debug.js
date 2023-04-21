import chalk from 'chalk';

import { parseTime } from '@videre/cli';

import { ERROR_MESSAGE } from 'constants';
import { logError } from 'utils/logging';

const Debug = {
  name: 'debug',
  description: "Displays the bot's current uptime, cluster info, and latency.",
  type: 'guild',
  execute({ client, interaction, args }) {
    try {
      // Get uptime in nearest days, hours, minutes and seconds
      let t = 0;
      const uptime = parseTime(client.uptime / 1000)
        // Add linebreak after second instance of comma
        .replace(/,/g, (match) => {
          t++;
          return (t === 2)
            ? ",\n"
            : match;
        }) + '.';

      const interaction_timestamp = Number(BigInt(interaction.id) >> 22n) + 1420070400000;

      return {
        embeds: [
          {
            title: 'Bot',
            fields: [
              // Uptime since 'Ready' status
              { name: 'Uptime', value: uptime, inline: false },
              // Process PID
              { name: 'PID', value: `\`${ process.pid }\``, inline: true },
              // Latency between Discord bot and user
              { name: 'Bot Latency', value: `\`${ Date.now() - interaction_timestamp } ms\``, inline: true },
              // Latency between Discord bot and Discord API
              { name: 'API Latency', value: `\`${ Math.round(client.ws.ping) } ms\``, inline: true },
            ],
          }
        ]
      };
    } catch (error) {
      logError(args, error, __filename);
      return ERROR_MESSAGE('An error occured while generating debugging data.', error, interaction);
    }
  },
};

export default Debug;