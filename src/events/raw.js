import chalk from 'chalk';
import { WebhookClient } from 'discord.js';
import { validateMessage, registerComponents } from 'utils/discord';
import { INTERACTION_TYPE, INTERACTION_RESPONSE_TYPE, ERROR_DEFAULTS } from 'constants';

/**
 * Handles interaction events.
 */
const RawEvent = {
  name: 'raw',
  async execute(client, packet) {
    try {
      if (packet.t !== 'INTERACTION_CREATE') return;
      const time_1 = new Date().getTime();

      const interaction = packet.d;
      const { type } = interaction;

      switch (type) {
        // Command interactions
        case INTERACTION_TYPE.APPLICATION_COMMAND: {
          const { name, options } = interaction.data;

          const command = client.commands.get(name);
          if (!command) return;

          // Create object with arg props
          let args = (options && options.length > 0) ? options.reduce((object, { name, value }) => {
            object[name] = value;
            return object;
          }, {}) : {};
          // Format args as url parameters for API
          const params = Object.keys(args)
            .map((arg, i) =>
                typeof(arg) == 'object'
                    ? arg.map(_arg => Object.keys(args)[i] + '=' + args[_arg])
                    : Object.keys(args)[i] + '=' + args[arg]
            ).join('&');
            
          const output = await command.execute({ client, interaction, args, params });
          if (!output) return;
          if (output?.deferred == true) {
            // Send follow-up response through `WebhookClient`
            const data = validateMessage(output.data);
            await new WebhookClient(client.user.id, interaction.token).send(data);
            if (!data.components) return;
            await new WebhookClient(client.user.id, interaction.token).send(validateMessage({
              ...ERROR_DEFAULTS,
              description: `**Note:** Button components aren't preserved with deferred\nresponses currently, which may break some functionality.`
            }));
            return;
          }

          const time_2 = ((2 * client.ws.ping) + new Date().getTime() - time_1);
          if (time_2 > 3000) return;

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

          const time_2 = ((2 * client.ws.ping) + new Date().getTime() - time_1);
          if (time_2 > 3000) return;

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
      console.error(chalk.white(`${chalk.yellow(`[events/raw]`)}\n>> ${chalk.red(error.stack)}`));
    }
  },
};

export default RawEvent;
