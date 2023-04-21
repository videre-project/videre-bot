import chalk from 'chalk';
import fetch from 'node-fetch';

import { MessageActionRow, MessageAttachment, MessageButton } from 'discord.js';

import { formatDeck, manamoji, drawDeck, cardPrices } from 'utils/magic';
import { logError } from 'utils/logging';

import getCardPreviews from 'utils/card-previews';

import { ERROR_DEFAULTS, ERROR_MESSAGE } from 'constants';

const Card = {
  name: 'card',
  description: "Returns a card by name via Scryfall. (Use `set:list` to show all printings)",
  type: 'global',
  options: [
    {
      name: 'name',
      description: 'A cardname to find a card via Scryfall.',
      type: 'string',
      required: true,
    },
    {
      name: 'set',
      description: 'A specific 3-letter set code to limit the search to.',
      type: 'string',
    },
    {
      name: 'collectors_number',
      description: 'A specific numeric collectors number to limit the search to.',
      type: 'integer',
    }
  ],
  async execute({ client, interaction, args }) {
    let { name, set, collectors_number } = args;

    if (name === 'test') {
      const result = await getCardPreviews(client);
      // result.forEach(res => console.log(res.embeds.length))
      // return result[0];
    }

    // For buttons interaction
    const { mode, uid } = args;
    if (mode) {
      [
        set,
        collectors_number,
        name
      ] = interaction?.message
        ?.components[0]
        ?.components[1]
        .url
        .split('/card/')[1]
        .split('/')
    }
    // For paginated cards list
    const { page, slice } = args;

    try {
      let data = {};
      let cardTitle = name;
      if (uid) {
        const response = await fetch(`https://api.scryfall.com/cards/${uid}`);
        data = await response.json();
        cardTitle = !data?.card_faces
          ? manamoji(
            client,//.guilds.resolve(config.emojiGuild),
            `${data.name} ${data.mana_cost}`
          ) : manamoji(
            client,//.guilds.resolve(config.emojiGuild),
            [
              `${data.card_faces[0].name} ${data.card_faces[0].mana_cost}`,
              `${data.card_faces[1].name} ${data.card_faces[1].mana_cost}`
            ].join(' // ')
          );
      } else if (!page) {
        // Fuzzy match name to exact cardname.
        let scryfallURL = `https://api.scryfall.com/cards/named?fuzzy=${ name }`;
        if (set && set !== 'list') scryfallURL += `&set=${set.replace(/[^0-9A-Z]+/gi,"")}`;
        if (collectors_number) scryfallURL += `+cn:${collectors_number}`;

        const response = await fetch(scryfallURL);

        // Handle conditions for invalid Scryfall response by each query parameter and condition
        if (response.status !== 200) {
          // Get fuzzy response without set
          let response_1 = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${ name }`);
          data = await response_1.json();
          if (response_1.status !== 200) {
            if (data.object === "error" || data.type === "ambiguous") {
              const _url = `https://api.scryfall.com/cards/autocomplete?q=${ name }`;
              response_1 = await fetch(
                `https://api.scryfall.com/cards/autocomplete?q=${ name }`
              ).then(res => res.json());
              const cards = response_1.data.slice(0, 10);

              // Create decklist object
              let decklist = {
                mainboard: cards.map(name => ({ quantity: 1, cardName: name })),
                sideboard: [],
              };

              // Get Scryfall card data
              const collection = await fetch("https://api.scryfall.com/cards/collection", {
                method: "post",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  "identifiers": [
                    ...decklist.mainboard.map(({ cardName }) => ({ "name": cardName.split('/')[0] })),
                    ...decklist.sideboard.map(({ cardName }) => ({ "name": cardName.split('/')[0] })),
                  ],
                }),
              }).then(res => res.json());

              if (collection.object == 'error') {
                return {
                  embeds: [{
                    ...ERROR_DEFAULTS,
                    description: 'No card matches were found.'
                  }],
                  ephemeral: true
                };
              }

              const _cards = collection.data;
              decklist = formatDeck(
                _cards,
                {
                  mainboard: _cards.map(({ set, collector_number }) => ({
                    quantity: `${ set.toUpperCase() }#${ collector_number }`
                  }))
                },
                client,//.guilds.resolve(config.emojiGuild),
              );

              const buffer = await drawDeck(decklist, 5, true);

              return {
                embeds: [{
                  ...ERROR_DEFAULTS,
                  description: [
                    `[Multiple different cards](${_url}) match the requested cardname.`,
                    'Please refine your search by adding more words or specifying a set code.',
                  ].join('\n'),
                  image: { url: 'attachment://canvas.png' },
                  footer: {
                    text: `Found ${_cards?.length} total matches for '${name}'.`
                  },
                }],
                files: [new MessageAttachment(buffer, 'canvas.png')],
                // Hide buttons if response is only 1 page long.
                components: response_1.total_cards > 10
                  ? [new MessageActionRow().addComponents(...buttons)]
                  : null,
                ephemeral: true
              }
            }
            // Handle miscellaneous errors
            throw new Error('The requested card could not be found.');
          }

          // Get and handle missing card printings
          const response_2 = await fetch(data.prints_search_uri);
          if (response_2.status !== 200) throw new Error('No printings for the requested card could be found.');
          let printings = await response_2.json();

          // Get and handle invalid set parameter
          let sets = printings['data'].map(({ set }) => set);
          let message = 'No match was found for the requested card in the specified set.';
          if (sets.length > 0) {
            let url = `https://scryfall.com/search?as=grid&order=released&q=%21%22${data?.name.replace(/\s/g, '%20')}%22&unique=prints`;
            message += `\nHowever, [${sets.length} available printings](${url}) were found.`;
          }
          if (sets.includes(set) !== true) {
            return {
              embeds: [{
                title: 'Error',
                description: message,
                thumbnail: {
                  url: !data?.card_faces
                    ? data.image_uris.png
                    : !data.card_faces[0]?.image_uris
                      ? data.image_uris.png
                      : data.card_faces[0].image_uris.png
                },
                footer: {
                  text: [
                      `🖌 ${data.artist}`,
                      `${data.set.toUpperCase()} (${data.lang.toUpperCase()}) #${data.collector_number}`,
                      data.rarity.replace(/^\w/, (c) => c.toUpperCase())
                    ].join(' • ')
                },
                color: 0xe74c3c,
              }],
              components: [],
              ephemeral: true
            };
          }

          // Handle other miscellaneous errors
          throw new Error('An error occured while fetching the requested card.');
        } else data = await response.json();

        cardTitle = !data?.card_faces
          ? manamoji(
            client,//.guilds.resolve(config.emojiGuild),
            `${data.name} ${data.mana_cost}`
          ) : manamoji(
            client,//.guilds.resolve(config.emojiGuild),
            [
              `${data.card_faces[0].name} ${data.card_faces[0].mana_cost}`,
              `${data.card_faces[1].name} ${data.card_faces[1].mana_cost}`
            ].join(' // ')
          );
      }
      if (mode == 'oracle' || !['prices'].includes(mode)) {
        // For set:list response w/ button interactions.
        if (slice || set == 'list') {
          if (slice) await interaction.deferUpdate();
          else await interaction.deferReply();

          const num_cards = 10;
          const num_rows = 5;
          
          let _uid = uid || data.oracle_id
          let _page = page || 1
          let _slice = slice || [0, num_cards];

          const response_1 = await fetch(
            `https://api.scryfall.com/cards/search?order=released&q=oracleid=${ _uid }&unique=prints&page=${ _page }`
          ).then(res => res.json());
          const cards = response_1.data.slice(_slice[0], _slice[1]);
          
          const decklist = formatDeck(
            cards,
            {
              mainboard: cards.map(({ set, collector_number }) => ({
                quantity: `${ set.toUpperCase() }#${ collector_number }`
              }))
            },
            client,//.guilds.resolve(config.emojiGuild),
          );
          
          const buffer = await drawDeck(decklist, num_rows, true);

          const page_idx = Math.ceil(_page - 1, 0) * Math.ceil(175 / num_cards)
            + Math.ceil(_slice[1] / num_cards);
          const pages = (Math.floor(response_1.total_cards / 175) * Math.ceil(175 / num_cards))
            + Math.ceil(
              (response_1.total_cards - (1 + 175 * Math.floor(response_1.total_cards / 175)))
              / num_cards
            );

          const buttons = [
            {
              label: '<<',
              props: {
                id: '0',
                page: 1,
                slice: [0, num_cards]
              },
              disabled: _page == 1 && _slice[0] < num_cards
            },
            {
              label: '← Back',
              props: {
                id: '1',
                page: _slice[0] < num_cards
                  ? _page - 1
                  : _page,
                slice: _slice[0] >= num_cards
                  ? [
                    Math.max(_slice[0] - num_cards, 0),
                    _slice[1] - num_cards
                  ] : [
                    Math.min(175, response_1.total_cards),
                    Math.min(175, response_1.total_cards) - num_cards
                  ]
              },
              disabled: _page == 1 && _slice[0] < num_cards
            },
            {
              label: 'Next →',
              props: {
                id: '2',
                page: 
                1 + _slice[1] > response_1.data.length
                  ? _page + 1
                  : _page,
                slice: _slice[1] < 175
                ? [_slice[0] + num_cards, _slice[1] + num_cards]
                : [0, num_cards]
              },
              disabled: (!response_1.has_more && _slice[1] >= Math.min(response_1.total_cards, 175))
              || page_idx >= pages
            },
            {
              label: '>>',
              props: {
                id: '3',
                page: Math.ceil(response_1.total_cards / 175),
                slice: [
                  Math.max(response_1.total_cards - (1 + num_cards + 175 * Math.floor(response_1.total_cards / 175)), 0),
                  response_1.total_cards - (1 + 175 * Math.floor(response_1.total_cards / 175))
                ]
              },
              disabled: (!response_1.has_more && _slice[1] >= Math.min(response_1.total_cards, 175))
              || page_idx >= pages
            }
          ].map(({ label, props, disabled }) =>
            new MessageButton()
              .setStyle('SECONDARY')
              .setLabel(label)
              .setCustomId(JSON.stringify({
                ...props,
                uid: _uid
              })).setDisabled(disabled)
          );

          return {
            embeds: [{
              title: slice
                ? interaction?.message?.embeds?.[0].title
                : cardTitle,
              description: slice
                ? interaction?.message?.embeds?.[0].description
                : 'Showing all printings for '
                  + (!data?.card_faces
                    ? data.name
                    : [data.card_faces[0].name, data.card_faces[1].name].join(' // '))
                  + ':',
              url: slice
                ? interaction?.message?.embeds?.[0].url
                : `https://scryfall.com/search?as=grid&order=released&q=%21%22${data?.name?.replace(/\s/g, '%20')}%22&unique=prints`,
              image: { url: 'attachment://canvas.png' },
              footer: { text: `Page ${ page_idx } out of ${ pages }` }
            }],
            files: [new MessageAttachment(buffer, 'canvas.png')],
            // Hide buttons if response is only 1 page long.
            components: response_1.total_cards > num_cards
              ? [new MessageActionRow().addComponents(...buttons)]
              : null,
            deferred: true
          }
        } else if (!collectors_number && set) {
          // Get cheapest (USD) printing by default for price info.
          let uri = `https://api.scryfall.com/cards/search?q=!"${ data.name }"+cheapest:usd`;
          if (set) uri += `&set=${set}`;

          const response_1 = await fetch(uri);
          if (data.set == set) data = (await response_1.json()).data[0];
        }

        const cardText = [...(data?.card_faces || [data])]
          .map(({
            name,
            mana_cost,
            type_line,
            oracle_text,
            flavor_text,
            power,
            toughness,
            loyalty
          }) =>
          manamoji(
            client,//.guilds.resolve(config.emojiGuild),
            (data?.card_faces
              ? `**${name}** ${mana_cost}\n`
              : '')
            + [type_line, oracle_text?.replace(/\*/g, '\\*')]
              .join('\n')
              .replace(/(\([^)]+\))/g, '*$1*')
          ) + (flavor_text
              ? `\n*${flavor_text.replace(/\*/g, '')}*`
              : '')
            + (power && toughness
              ? `\n${power.replace(/\*/g, '\\*')}/${toughness.replace(/\*/g, '\\*')}`
              : '')
            + (loyalty
              ? `\nLoyalty: ${loyalty.replace(/\*/g, '\\*')}`
              : '')
          ).join("\n---------\n");

        const thumbnailImage = !data?.card_faces
          ? data?.image_uris?.png || []
          : (!data.card_faces[0]?.image_uris
            ? data.image_uris.png
            : data.card_faces[0].image_uris.png);
        
        const footerText = [
          `🖌 ${data.artist}`,
          `${data.set.toUpperCase()} (${data.lang.toUpperCase()}) #${data.collector_number}`,
          data.rarity.replace(/^\w/, (c) => c.toUpperCase())
        ].join(' • ');

        const embed = {
          title: cardTitle,
          url: data.scryfall_uri.split('?utm_source')[0],
          description: cardText,
          thumbnail: { url: thumbnailImage },
          footer: { text: footerText },
        };

        const button = new MessageButton()
          .setStyle('PRIMARY')
          .setLabel('Show Price History')
          .setCustomId(JSON.stringify({
            mode: 'prices'
          })).setEmoji('837140782820622346') // :manat: tap emoji

        const scryfall_page = new MessageButton()
          .setStyle('LINK')
          .setLabel('Open Scryfall Page')
          .setURL(data.scryfall_uri?.replace('?utm_source=api', ''))
          .setEmoji('924336738170703963'); // :Scryfall: scryfall emoji

        return {
          embeds: [embed],
          components: [new MessageActionRow().addComponents(button, scryfall_page)]
        }
      } else if (mode == 'prices') {
        await interaction.deferUpdate();

        const output = await cardPrices({
          cardname: data.name,
          set: data.set.toUpperCase()
        });
  
        const json = output.toString().length > 2
          ? JSON.parse(output.toString())
          : {};

        const imageStream = JSON.stringify(json).length > 2
          ? new Buffer.from(json?.graph, 'base64')
          : {};
  
        const evalPrice = (item) => typeof item === 'object'
          ? '—'
          : (item > -1 ? item : '—');
  
        const embed = {
          ...interaction.message.embeds[0],
          url: json?.url || '',
          description: JSON.stringify(json).length > 2
            ? `Showing price history for **${data.set_name}** (**${data.set.toUpperCase()}**):`
            : `No price history was found for **${data.set_name}** (**${data.set.toUpperCase()}**).`,
          fields: [
            {
              name: 'USD',
              value: `$**${ evalPrice(data.prices?.usd) }** | $**${ evalPrice(data.prices?.usd_foil) }**`,
              inline: true
            },
            {
              name: 'EUR',
              value: `€**${ evalPrice(data.prices?.eur) }** | €**${ evalPrice(data.prices?.eur_foil) }**`,
              inline: true
            },
            {
              name: 'TIX',
              value: `**${ evalPrice(data.prices?.tix) }** tix | **${ evalPrice(data.prices?.tix_foil) }** tix`,
              inline: true
            },
          ],
          image: JSON.stringify(json).length > 2 ? { url: 'attachment://file.jpg' } : null,
        }

        const button = new MessageButton()
          .setStyle('PRIMARY')
          .setLabel('Show Oracle Text')
          .setCustomId(JSON.stringify({
            mode: 'oracle'
          })).setEmoji('837140782804500490'); // :manaq: untap emoji

        const scryfall_page = new MessageButton()
          .setStyle('LINK')
          .setLabel('Open Scryfall Page')
          .setURL(data.scryfall_uri?.replace('?utm_source=api', ''))
          .setEmoji('924336738170703963'); // :Scryfall: scryfall emoji
          
        return {
          embeds: [embed],
          files: embed.image ? [imageStream] : null,
          components: [new MessageActionRow().addComponents(button, scryfall_page)],
          deferred: true
        };
      }
    } catch (error) {
      logError(args, error, __filename);
      return ERROR_MESSAGE('An error occured while fetching card data.', error, interaction);
    }
  },
};

export default Card;