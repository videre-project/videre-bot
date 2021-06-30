import chalk from 'chalk';
import { formatListAsPages } from 'utils/discord';

const Help = {
  name: 'help',
  description: "Displays this bot's commands.",
  execute({ commands }) {
    try {
      const commandList = commands.map(({ name, options, description }) => {
        const args = options?.map(({ name }) => ` \`${name}\``) || '';

        return { name: `/${name} ${args}`, value: description };
      });

      return formatListAsPages(
        commandList,
        { title: 'Commands' },
        0, 10, 'fields'
      );
    } catch (error) {
      console.error(chalk.white(`${chalk.blue(`[/Help]`)} args: [ None ]\n>> ${chalk.red(error.stack)}`));
    }
  },
};

export default Help;
