import chalk from 'chalk';
import config from 'config';
import { formatListAsPages } from 'utils/discord';

const Help = {
  name: 'help',
  description: "Displays this bot's commands.",
  type: 'global',
  execute({ client, interaction }) {
    try {
      // const commandList = commands.map(({ name, options, description }) => {
      //   const args = options?.map(({ name }) => ` \`${name}\``) || '';

      //   return { name: `/${name} ${args}`, value: description };
      // });

      let fields = [];
      if (config.guild && interaction?.guild_id === config.guild) {
        fields = client.commands.map(({ name, options, description }) => ({
            name: `/${name}${options?.map(({ name }) => ` \`${name}\``) || ''}`,
            value: description,
          }));
      } else {
        fields = client.commands.map(({ name, description, type, options }) => (type === 'global') ? ({
          name: `/${name}${options?.map(({ name }) => ` \`${name}\``) || ''}`,
          value: description,
        }) : {} ).filter(value => Object.keys(value).length !== 0);
      }

      return formatListAsPages(
        fields,
        { title: 'Commands' },
        0, 10, 'fields'
      );
    } catch (error) {
      console.error(chalk.white(`${chalk.blue(`[/Help]`)} args: [ None ]\n>> ${chalk.red(error.stack)}`));
    }
  },
};

export default Help;
