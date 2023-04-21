import { ERROR_MESSAGE } from 'constants';
import { logError } from 'utils/logging';

const Quote = {
  name: 'quote',
  description: "Quotes a message by a provided message link.",
  type: 'global',
  options: [
    {
      name: 'message_link',
      description: 'A link from Discord to the desired message.',
      type: 'string',
      required: true,
    },
    {
      name: 'hide_original',
      description: 'Hide original message (Shows only \'jump to link\' hyperlink).',
      type: 'boolean',
    },
  ],
  async execute({ client, interaction, args }) {
    const { message_link, hide_original } = args;
    // const hide_original = args?.hide_original;
    try {
      const [guildID, channelID, messageID] = message_link.split('discord.com/channels/')[1].split('/');

      const channel = await client.channels.fetch(channelID);
      const message = await channel.messages.fetch(messageID);

      const content_char_length = message?.content ? message.content.length : '';
      const embed_char_length = message?.embeds?.[0] ? message.embeds[0].length : '';
      const char_count = content_char_length + embed_char_length;

      const avatarURL = `https://cdn.discordapp.com/avatars/${ message.author.id }/${ message.author.avatar }.webp?size=128`;
      const channelIcon = `https://cdn.discordapp.com/icons/${ guildID }/${ message.guild.icon }.webp?size=128`;

      let embed = {
        author: {
          name: `${message.author.username}#${ message.author.discriminator } (Jump to message)`,
          url: `https://discord.com/channels/${ [guildID, channelID, messageID].join('/') }`,
          icon_url: avatarURL,
        },
        footer: {
          text: `Sent in #${channel.name} from ${message.guild.name}`,
          icon_url: channelIcon,
        },
        timestamp: new Date(message.createdTimestamp).toISOString()
      };

      if (hide_original) {
        return {
          embeds: [embed]
        };
      }

      if (!(hide_original) || char_count > 2000) {
        if (message?.embeds.length > 0 && message?.embeds[0]?.type == 'rich') {
          if (message.embeds.length == 1) {
            if (message.embeds[0]?.title) embed.title = message.embeds[0].title;
            if (message.embeds[0]?.url) embed.url = message.embeds[0].url;
            if (message.embeds[0]?.description) embed.description = message.embeds[0].description;
            if (message.embeds[0]?.fields) embed.fields = message.embeds[0].fields;
            if (message.embeds[0]?.image) embed.image = message.embeds[0].image;
            if (message.embeds[0]?.thumbnail) embed.thumbnail = message.embeds[0].thumbnail;
          } else {
            embed.description = `\`[ Embeds: ${ message.embeds.length } ]\``;
          }
          if (!message?.content) return embed;
        }

        if (message?.content) {
          if (message.content.match(/.(jpg|jpeg|png|gif)$/i) && (message.content.match(/ /g) || []).length == 0) {
            embed.image = { 'url': message.content };
          } else {
            embed.description = message.content;
          }
        }

        if (JSON.stringify(message?.attachments) !== '[]') {
          if (message.attachments/**.array()[0]*/?.height > 0) {
            embed.image = { 'url': message.attachments/**.array()[0]*/.url };
          } else {
            embed.description = `\`[ Attachment: ${ message.attachments/**.array()[0]*/.name } ]\``;
          }
        }
      } else {
        const _desc = `**>** \`[${[
          message?.embeds?.length
            ? `${ message.embeds.length } ${ message.embeds.length == 1 ? 'embed' : 'embeds' };`
            : undefined,
          `${ char_count } ${ char_count == 1 ? 'character' : 'characters' }`
        ].join(' ')}]\``;
        if (message?.embeds?.[0]?.title) embed.title = message.embeds[0].title;
        if (embed.title == 'Metagame') {
          embed.fields = [{ name: message.embeds[0].fields[0].name, value: _desc }];
        } else embed.description = _desc;
      }

      return embed;

    } catch (error) {
      logError(args, error, __filename);
      return ERROR_MESSAGE('An error occured while quoting a message.', error, interaction);
    }
  },
};

export default Quote;