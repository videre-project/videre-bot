import chalk from 'chalk';
import { validateMessage, registerComponents } from 'utils/discord';
import { INTERACTION_TYPE, INTERACTION_RESPONSE_TYPE } from 'constants';

/**
 * Handles interaction events.
 */
const RawEvent = {
  name: 'raw',
  async execute(client, packet) {
    try {
      if (packet.t !== 'INTERACTION_CREATE') return;

      const interaction = packet.d;
      const { type } = interaction;

      switch (type) {
        // Command interactions
        case INTERACTION_TYPE.APPLICATION_COMMAND: {
          const { name, options } = interaction.data;

          const command = client.commands.get(name);
          if (!command) return;

          let args = (options && options.length > 0) ? options.reduce((object, { name, value }) => {
            object[name] = value;
            return object;
          }, {}) : {};

          const output = await command.execute({ ...client, interaction, args });
          if (!output) return;

          const data = validateMessage(output);
          await client.api.interactions(interaction.id, interaction.token).callback.post({
            data: {
              type: INTERACTION_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
              data,
            },
          });
          if (!data.components) return;

          const message = await client.api
            .webhooks(client.user.id, interaction.token)
            .messages('@original')
            .get();

          return registerComponents(client, message.id, data.components);
        }
        // Button interactions
        case INTERACTION_TYPE.BUTTON: {
          const listenerId = `${interaction.message.id}-${interaction.data.custom_id}`;

          const callback = client.listeners.get(listenerId);
          if (!callback) return;

          const output = await callback(interaction);
          if (!output) return;

          const data = validateMessage(output);
          return client.api
            .interactions(interaction.id, interaction.token)
            .callback.post({
              data: {
                type: INTERACTION_RESPONSE_TYPE.UPDATE_MESSAGE,
                data,
              },
            });
        }
        default:
          return;
      }
    } catch (error) {
      console.error(chalk.white(`${chalk.red(`[events/raw]`)}\n>> ${chalk.red(error.stack)}`));
    }
  },
};

export default RawEvent;
