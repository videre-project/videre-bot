import chalk from 'chalk';

/**
 * Handles the bot's ready state.
 */
const ReadyEvent = {
  name: 'ready',
  once: true,
  async execute(client) {
    try {
      const username = `${client.user.username}${chalk.grey(`#${client.user.discriminator}`)}`;
      console.info(`${chalk.cyanBright('[Bot]')} Connected as ${username}`);
    } catch (error) {
      console.error(chalk.white(`${chalk.yellow(`[ReadyEvent]`)}\n>> ${chalk.red(error.stack)}`));
    }
  },
};

export default ReadyEvent;
