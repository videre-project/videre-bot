import chalk from 'chalk';
import { ERROR_DEFAULTS } from 'constants';

// import { MessageActionRow, MessageButton } from 'discord.js';

import { sanitize, validateMessage, registerComponents } from 'utils/discord';
import { extractUrls, matchDeckUrl } from 'utils/deck-urls';

// // TODO: use options interaction object for fetching prev args
// console.log(interaction.options.data);

/**
 * Handles interaction events.
 */
const InteractionEvent = {
  name: 'interactionCreate',
  async execute(client, interaction) {
    try {
      const time_1 = new Date().getTime();
      function time_2(time = time_1) {
        return (2 * client.ws.ping)
          + new Date().getTime() - time;
      }
      switch (interaction.type) {
        // Command interactions
        case 'APPLICATION_COMMAND': {
          const { commandName, options } = interaction;

          const command = client.commands.get(commandName);
          if (!command) return;

          // Create object with arg props
          let args = (options?.data)
            ? options.data.reduce((object, { name, value }) => {
                object[name] = sanitize(value);
                return object;
              }, {})
            : {};

          const output = await command.execute({
            client,
            interaction,
            args,
          });
          if (!output) return;

          const data = validateMessage(output);

          // const util = require('util');
          // console.log(util.inspect(output, false, null, true));

          if (output?.deferred) {
            // Timeout after 15 minutes.
            if (time_2() >= 9 * 10**5) return;
            await interaction.editReply(data);
          } else {
            // Timeout after 3 seconds.
            if (time_2() >= 3 * 10**3) return;
            await interaction.reply(data);
          }
          if (!data.components) return;

          const message = await interaction.fetchReply();

          return registerComponents(client, message.id, data.components);
        }
        // Button interactions
        case 'MESSAGE_COMPONENT': {
          try {
            if (interaction.customId === 'x_button') {
              return await interaction.message.delete();
            } else if (interaction.customId === 'null') {
              return;
            }

            // Handle visual loading state
            const embedTitle = interaction.message.embeds?.[0]?.title;
            // if (interaction.componentType !== 'SELECT_MENU') {
            if (!['Help', 'Metagame'].includes(embedTitle)) {
              const components = interaction.message.components
                ?.map(row => {
                  const _components = row.components
                    .map(button => {
                      if (button?.url && button.style === 'LINK') {
                        return button;
                      }
                      else return { ...button, disabled: true };
                    });
                  return { ...row, components: _components };
                });
              await interaction.message.edit(
                validateMessage({
                  content: '',
                  embeds: [{
                    fields: [{
                      name: '<a:loading:951315050826715166>  Fetching response...',
                      value: 'This should take no more than a few seconds.'
                    }],
                    color: '#99aab5', //'#7289da'
                  }],
                  components
                })
              );
              await interaction.message.removeAttachments();
            }

            // // Timeout after 15 minutes.
            // const timestamp = interaction.message.createdTimestamp;
            // if (time_2(new Date(timestamp)) >= 9 * 10**5) {
            //   const components = interaction.message.components
            //     ?.map(row => {
            //       const _components = row.components
            //         .map(button => {
            //           if (button?.url && button.style === 'LINK') {
            //             return button;
            //           }
            //           else return { ...button, disabled: true };
            //         });
            //       return { ...row, components: _components };
            //     });
            //   await interaction.message.removeAttachments();
            //   await interaction.message.edit(
            //     validateMessage({
            //       ...interaction.message, components
            //     })
            //   );

            //   const { commandName } = interaction?.message?.interaction;
            //   // const button = new MessageButton()
            //   //   .setStyle('PRIMARY')
            //   //   .setLabel('Start a new interaction')
            //   //   .setCustomId(interaction.customId.toString());
            //   await interaction.reply(
            //     validateMessage({
            //       embeds: [{
            //         ...ERROR_DEFAULTS,
            //         title: 'This interaction has expired.',
            //         description: `Use \`/${commandName}\` to create a new interaction.`,
            //         footer: { text: 'You can also use /help for more command info.' }
            //       }],
            //       // components: [new MessageActionRow().addComponents(button)],
            //       ephemeral: true
            //     })
            //   );
            //   return;
            // }

            let command, _args;
            if (!interaction.message.interaction) {
              if (interaction.customId == 'decklist-prompt') {
                command = client.commands.get('decklist');
                const { messageId } = interaction.message.reference;
                const decklist_url = await interaction
                .message
                .channel.messages.fetch(messageId)
                .then(msg => 
                  extractUrls(msg.content)
                    .map(url => matchDeckUrl(url))
                    .filter(Boolean)[0]
                );
                _args = JSON.stringify({
                  decklist_url,
                  mode: false
                });
              }
            } else {
              const { commandName } = interaction?.message?.interaction;
              command = client.commands.get(commandName);

              if (interaction.componentType === 'SELECT_MENU') {
                // await interaction.deferReply({ ephemeral: true });
                let options = [],
                  optionLabel = '',
                  emoji = {};

                const components = interaction.message.components
                  ?.map(row => {
                    const _components = row.components
                      .map(button => {
                        if (button.customId === interaction.customId) {
                          options = button.options;
                          optionLabel = options
                            .filter(({ value }) => interaction.values.includes(value))
                            .map(({ emoji, label }) => label)
                            ?.[0];
                          emoji = options
                            .filter(({ label }) => label == optionLabel)
                            .map(({ emoji }) => `<:${emoji.name}:${emoji.id}>`)
                            ?.[0];

                          return {
                            ...button,
                            placeholder: optionLabel,
                            disabled: true
                          }
                        } else if (button?.url && button.style === 'LINK') {
                          return button;
                        } else return { ...button, disabled: true };
                      });
                    return { ...row, components: _components };
                  });
                await interaction.message.removeAttachments();

                await interaction.message.edit(
                  validateMessage({
                    ...interaction.message,
                    content: `Selected ${emoji} **${optionLabel}**.`,
                    components
                  })
                );

                _args = JSON.stringify({
                  [interaction.customId]: interaction.values[0]
                });
              }
            }

            // Create object with arg props
            const args = JSON.parse(_args || interaction.customId);

            const output = await command.execute({
              client,
              interaction,
              args,
            });
            if (!output) return;

            const data = validateMessage(output);

            // Address persisting attachment behavior.
            await interaction.message.removeAttachments();
  
            if (output?.deferred) {
              // Timeout after 15 minutes.
              if (time_2() >= 9 * 10**5) return;
              if (interaction.componentType === 'SELECT_MENU') {
                // await interaction.deleteReply();
                // const isError = output?.embeds?.[0] === 'Error';
                // await interaction.editReply(
                //   validateMessage({
                //     embeds: [{
                //       title: !isError ? 'Success' : 'Error',
                //       color: !isError ? '#009944' : '#cf000f',
                //       description: !isError
                //         ? 'Message response was successfully updated.'
                //         : 'An error occured while fetching a response.'
                //     }]
                //   })
                // );
                return await interaction.message.edit(data);
              } else {
                return await interaction.editReply(data);
              }
            } else {
              // Timeout after 3 seconds.
              if (time_2() >= 3 * 10**3) return;
              return await interaction.update(data);
            }
          } catch {
            const listenerId = `${interaction.message.id}-${interaction.customId}`;
            const callback = client.listeners.get(listenerId);
            if (!callback) return;

            const output = await callback(interaction);
            if (!output) return;

            const data = validateMessage(output);

            // Timeout after 3 seconds.
            if (time_2() >= 3 * 10**3) return;
            // Address persisting attachment behavior.
            await interaction.message.removeAttachments();
            return await interaction.update(data);
          }
        }
        default:
          return;
      }
    } catch (error) {
      console.error(chalk.white(`${chalk.yellow(`[interactionCreate]`)}\n>> ${chalk.red(error.stack)}`));
    }
  },
};

export default InteractionEvent;
