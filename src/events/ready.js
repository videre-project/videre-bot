import chalk from 'chalk';

/**
 * Handles the bot's ready state.
 */
const ReadyEvent = {
  name: 'ready',
  once: true,
  execute(client) {
    try {
      console.info(`${chalk.cyanBright('[Bot]')} Connected as ${client.user.username}${chalk.grey(`#${client.user.discriminator}`)}`);
    } catch {
      console.error(chalk.white(`${chalk.red(`[events/ready]`)}\n>> ${chalk.red(error.stack)}`));
    }
  },
};

export default ReadyEvent;
