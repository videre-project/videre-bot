import chalk from 'chalk';

import { formatListAsPages, createPagesInteractive } from 'utils/discord/interactive.js';
import config from 'config';
import { ERROR_MESSAGE } from 'constants';

const Help = {
  name: 'help',
  description: "Displays a list of this bot's commands.",
  type: 'global',
  async execute({ client, interaction }) {
    try {
      let fields = [];
      if (interaction?.guild_id == config.guild) {
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

      const pages = formatListAsPages(
        fields,
        { title: 'Commands' },
        10, 'fields'
      );

      return await createPagesInteractive(pages);
    } catch (error) {
      console.error(
        chalk.white(`${chalk.blue('[/Help]')} args: [ None ]\n>> ${chalk.red(error.stack)}`)
      );
      return ERROR_MESSAGE('An error occured while fetching command data.', error, interaction);
    }
  },
};

export default Help;