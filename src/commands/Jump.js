import { Console } from 'console';
import { ERROR_MESSAGE } from 'constants';
import { logError } from 'utils/logging';

const Quote = {
  name: 'jump',
  description: "sends a link to allow users to jump to a different channel",
  type: 'global',
  options: [
    {
      name: 'channel',
      description: 'Use the \'#\' symbol to type the channel name.',
      type: 'string',
      required: true,
    },
  ],
  async execute({ client, interaction, args }) {
    const guildIcon = (id, icon) => `https://cdn.discordapp.com/icons/${ id }/${ icon }.webp?size=128`;
    const msg_hyperlink = (obj) => `https://discord.com/channels/${ [obj.guildId, obj.channelId, obj.id].join('/') }`;
    try {
      // Fetch metadata for previous channel
      const {
        guild: {
          id: prev_guild_id,
          name: prev_guild_name,
          icon: prev_guild_icon
        },
        id: prev_channel_id,
        name: prev_channel_name
      } = interaction.channel;

      await interaction.deferReply();

      // Fetch metadata for new channel
      const [new_channel_id] = args.channel.match(/(?<=&lt;#)(.*)(?=&gt;)/g);
      const {
        guild: {
          id: new_guild_id,
          name: new_guild_name,
          icon: new_guild_icon
        },
        name: new_channel_name
      } = await client.channels.fetch(new_channel_id);

      // Send seeded message in new channel
      const deferred_msg = await interaction.fetchReply();
      const msg_2 = await client.channels
        .cache.get(new_channel_id)
        .send({
          embeds: [{
            author: {
              name: `Jump back to #${prev_channel_name} in ${prev_guild_name}`,
              url: msg_hyperlink(deferred_msg),
              icon_url: guildIcon(prev_guild_id, prev_guild_icon),
            },
            description: `<@${interaction.user.id}> has started a new conversation here.`,
            timestamp: new Date(deferred_msg.createdTimestamp).toISOString(),
            color: '#CC7900' // Orange
          }]
        });

      await interaction.followUp({
        embeds: [{
          author: {
            name: `Jump in to #${new_channel_name} in ${new_guild_name}`,
            url: msg_hyperlink(msg_2),
            icon_url: guildIcon(new_guild_id, new_guild_icon),
          },
          timestamp: new Date(deferred_msg.createdTimestamp).toISOString(),
          color: '#0099E1' // Blue
        }]
      });

    } catch (error) {
      logError(args, error, __filename);
      // return ERROR_MESSAGE('An error occured while quoting a message.', error, interaction);
    }
  },
};

export default Quote;