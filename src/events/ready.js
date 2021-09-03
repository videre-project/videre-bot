import chalk from 'chalk';

/**
 * Handles the bot's ready state.
 */
const ReadyEvent = {
  name: 'ready',
  once: true,
  async execute(client) {
    try {
      console.info(`${chalk.cyanBright('[Bot]')} Connected as ${client.user.username}${chalk.grey(`#${client.user.discriminator}`)}`);
      await client.user.setPresence({
        status: 'online',
        activity: {
            name: 'feedback • /help',
            type: 'LISTENING',
        }
      });
    } catch (error) {
      console.error(chalk.white(`${chalk.yellow(`[events/ready]`)}\n>> ${chalk.red(error.stack)}`));
    }
  },
};

export default ReadyEvent;
