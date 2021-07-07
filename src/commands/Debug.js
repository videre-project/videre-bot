import chalk from 'chalk';

const Debug = {
    name: 'debug',
    description: "Displays the bot's current uptime, cluster info, and latency.",
    type: 'guild',
    execute({ client, interaction }) {
      try {
        // Get uptime in nearest days, hours, minutes and seconds
        let totalSeconds = client.uptime / 1000;
        let days = Math.floor(totalSeconds / 86400).toFixed(0);
        let hours = Math.floor(totalSeconds / 3600).toFixed(0);
  
        totalSeconds %= 3600;
  
        let minutes = Math.floor(totalSeconds / 60).toFixed(0);
        let seconds = (totalSeconds % 60).toFixed(0);
  
        // Create array of these values to later filter out null values
        let formattedArray = [
          days > 0 ? `${ days } ${ (days == 1 ? 'day' : 'days') }` : ``,
          hours > 0 ? `${ hours } ${ (hours == 1 ? 'hour' : 'hours') }` : ``,
          minutes > 0 ? `${ minutes } ${ (minutes == 1 ? 'minute' : 'minutes') }` : ``,
          seconds > 0 ? `${ seconds } ${ (seconds == 1 ? 'second' : 'seconds') }` : ``,
        ];
  
        let t = 0;
        const _uptime = formattedArray
          .filter(Boolean)
          .join(', ')
          // Replace last comma with ' and' for fluency
          .replace(/, ([^,]*)$/, ' and $1')
          // Add linebreak after second instance of comma
          .replace(/,/g, function (match) {
            t++; return (t === 2) ? ",\n" : match;
          }) + '.';
  
        let interaction_timestamp = Number(BigInt(interaction.id) >> 22n) + 1420070400000;
  
        return {
          title: 'Debug',
          fields: [
            // Uptime since 'Ready' status
            { name: 'Current Uptime', value: _uptime, inline: false },
            // Latency between Discord bot and user
            { name: 'Bot Latency', value: `\`${ Date.now() - interaction_timestamp } ms\``, inline: true },
            // Latency between Discord bot and Discord API
            { name: 'API Latency', value: `\`${ Math.round(client.ws.ping) } ms\``, inline: true },
          ],
        };
      } catch (error) {
        console.error(
          chalk.cyan(`[/debug]`)+
          chalk.grey('\n>> ') + chalk.red(`Error: ${error.message}`)
        );
        return {
          title: 'Error',
          description: error.message,
          color: 0xe74c3c,
          ephemeral: true,
        };
      }
    },
  };
  
  export default Debug;
  