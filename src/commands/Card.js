import chalk from 'chalk';
import fetch from 'node-fetch';

import config from 'config';
import { ERROR_DEFAULTS, INTERACTION_RESPONSE_TYPE } from 'constants';

import { manamoji } from 'utils/magic';
import { toPascalCase, formatMonospaceTable, formatListAsPages } from 'utils/discord';

const Card = {
  name: 'card',
  description: "Returns a card by name via Scryfall.",
  type: 'global',
  options: [
    {
      name: 'name',
      description: 'A cardname to find a card via Scryfall.',
      type: 'string',
      // required: true,
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
    },
    {
      name: 'prices',
      description: 'Flag to show card prices and price history instead.',
      type: 'boolean',
    },
    {
      name: 'decks',
      description: 'Flag to show card matches in archetype decklists instead.',
      type: 'boolean',
    },
    {
      name: 'query',
      description: 'Query to filter archetype decklists by. Modifies \'decks\' flag.',
      type: 'string',
    }
  ],
  async execute({ client, interaction, args }) {

    const name = args?.name;
    const set = args?.set;
    const collectors_number = args?.collector_number;
    const prices = args?.prices;
    const decks = args?.query ? true : args?.decks;
    const query = args?.query;

    try {
      let scryfallURL = `https://api.scryfall.com/cards/named?fuzzy=${name}`;
      if (set) scryfallURL += `&set=${set.replace(/[^0-9A-Z]+/gi,"")}`;

      let response = await fetch(scryfallURL);

      // Handle conditions for invalid Scryfall response by each query parameter and condition
      if (response.status !== 200 && !(!name && (decks || query))) {
        // Get fuzzy response without set
        const response_1 = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${name}`);
        let data = await response_1.json();
        if (response_1.status !== 200) {
          if (data.object === "error" || data.type === "ambiguous")
          throw new Error(`Multiple different cards match the requested cardname.\nPlease refine your search by adding more words or specifying a set code.`);
          // Handle miscellaneous errors
          throw new Error(`The requested card could not be found.`);
        }

        // Get and handle missing card printings
        const response_2 = await fetch(data.prints_search_uri);
        if (response_2.status !== 200) throw new Error(`No printings for the requested card could be found.`);
        let printings = await response_2.json();

        // Get and handle invalid set parameter
        let sets = printings['data'].map(({ set }) => set);
        let message = 'No match was found for the requested card in the specified set.';
        if (sets.length > 0) {
          let url = `https://scryfall.com/search?as=grid&order=released&q=%21%22${data?.name.replace(/\s/g, '%20')}%22&unique=prints`;
          message += `\nHowever, [${sets.length} available printings](${url}) were found.`;
        }
        if (sets.includes(set) !== true) return {
          title: 'Error',
          description: message,
          thumbnail: {
            url: !data?.card_faces ? data.image_uris.png : (!data.card_faces[0]?.image_uris ? data.image_uris.png : data.card_faces[0].image_uris.png)
          },
          footer: {
            text: [
                `🖌 ${data.artist}`,
                `${data.set.toUpperCase()} (${data.lang.toUpperCase()}) #${data.collector_number}`,
                data.rarity.replace(/^\w/, (c) => c.toUpperCase())
              ].join(' • ')
          },
          color: 0xe74c3c,
          ephemeral: true,
        };

        // Handle other miscellaneous errors
        throw new Error(`An error occured while fetching the requested card.`);
      }
      let data = await response.json();

      // Get cheapest (USD) printing by default for price info.
      if (prices === true) {
        let sorted_prices = `https://api.scryfall.com/cards/search?q=!"${data.name}"+cheapest:usd`;
        if (set) sorted_prices += `+e:${set}`;
        if (collectors_number) sorted_prices += `+cn:${collectors_number}`
        const response_1 = await fetch(sorted_prices);
        let data_1 = await response_1.json();
        if (response_1.status === 200) data = data_1.data[0];
      }

      const cardTitle = (!data?.card_faces) ? manamoji(
        client.guilds.resolve(config.emojiGuild),
          [data.name, data.mana_cost].join(' ')
        ) : manamoji(
        client.guilds.resolve(config.emojiGuild), [
          `${data.card_faces[0].name} ${data.card_faces[0].mana_cost}`,
          `${data.card_faces[1].name} ${data.card_faces[1].mana_cost}`
        ].join(' // '));

      const thumbnailImage = decks || (!name ?? !data?.card_faces)
        ? data?.image_uris?.png || []
        : (!data.card_faces[0]?.image_uris ? data.image_uris.png : data.card_faces[0].image_uris.png);

      const footerText = decks || !name
        ? []
        : [
          `🖌 ${data.artist}`,
          `${data.set.toUpperCase()} (${data.lang.toUpperCase()}) #${data.collector_number}`,
          data.rarity.replace(/^\w/, (c) => c.toUpperCase())
        ].join(' • ');

      // Fetch Oracle Text only
      if (prices !== true && decks !== true) {
        // Handle Single-Sided Cards
        if (!data?.card_faces) {
          let cardText = manamoji(
            client.guilds.resolve(config.emojiGuild),
            [data.type_line, data.oracle_text.replace(/\*/g, '\\*')].join('\n')
            .replace(/(\([^)]+\))/g, '*$1*')
          );

          if (data?.flavor_text) cardText += `\n*${data.flavor_text.replace(/\*/g, '')}*`;
          if (data?.power && data?.toughness) cardText += `\n${data.power.replace(/\*/g, '\\*')}/${data.toughness.replace(/\*/g, '\\*')}`;
          if (data?.loyalty) cardText += `\nLoyalty: ${data.loyalty.replace(/\*/g, '\\*')}`;

          return {
            title: cardTitle,
            url: data.scryfall_uri,
            description: cardText,
            thumbnail: {
              url: thumbnailImage
            },
            footer: {
              text: footerText
            },
          };
        } 
        // Handle Double-Sided Cards
        else {
          let cardText = manamoji(
            client.guilds.resolve(config.emojiGuild),
            `**${data.card_faces[0].name}** ${data.card_faces[0].mana_cost}`
          );

          cardText += "\n" + manamoji(
            client.guilds.resolve(config.emojiGuild),
            [data.card_faces[0].type_line, data.card_faces[0].oracle_text].join('\n')
            .replace(/\*/g, '\\*')
            .replace(/(\([^)]+\))/g, '*$1*')
          );

          if (data.card_faces[0]?.flavor_text) cardText += `\n*${data.card_faces[0].flavor_text.replace(/\*/g, '')}*`;
          if (data.card_faces[0]?.power && data.card_faces[0]?.toughness) cardText += `\n${data.card_faces[0].power.replace(/\*/g, '\\*')}/${data.card_faces[0].toughness.replace(/\*/g, '\\*')}`;
          if (data.card_faces[0]?.loyalty) cardText += `\nLoyalty: ${data.card_faces[0].loyalty.replace(/\*/g, '\\*')}`;

          cardText += "\n---------\n" + manamoji(
            client.guilds.resolve(config.emojiGuild),
            `**${data.card_faces[1].name}** ${data.card_faces[1].mana_cost}`
          );

          cardText += "\n" + manamoji(
            client.guilds.resolve(config.emojiGuild),
            [data.card_faces[1].type_line, data.card_faces[1].oracle_text].join('\n')
            .replace(/\*/g, '\\*')
            .replace(/(\([^)]+\))/g, '*$1*')
          );

          if (data.card_faces[1]?.flavor_text) cardText += `\n*${data.card_faces[1].flavor_text.replace(/\*/g, '\\*')}*`;
          if (data.card_faces[1]?.power && data.card_faces[1]?.toughness) cardText += `\n${data.card_faces[1].power.replace(/\*/g, '\\*')}/${data.card_faces[1].toughness.replace(/\*/g, '\\*')}`;
          if (data.card_faces[1]?.loyalty) cardText += `\nLoyalty: ${data.card_faces[1].loyalty.replace(/\*/g, '\\*')}`;

          return {
            title: cardTitle,
            url: data.scryfall_uri,
            description: cardText,
            thumbnail: {
              url: thumbnailImage
            },
            footer: {
              text: footerText
            },
          };
        }

      } else if (prices == true && decks !== true) {
        // Initial Deferred Response
        await client.api.interactions(interaction.id, interaction.token).callback.post({
          data: { type: INTERACTION_RESPONSE_TYPE.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE },
        });
        
        const child_process = require("child_process");
        const cardPrices = await child_process.execSync(`python ./src/utils/cardPrices.py --cardname "${ data.name }" --set "${ data.set.toUpperCase() }"`);

        const json = cardPrices.toString().length > 2 ? JSON.parse(cardPrices.toString()) : {};
        const imageStream = cardPrices.toString().length > 2 ? new Buffer.from(json?.graph, 'base64') : {};

        const description = `Showing price history for **${data.set_name}** (**${data.set.toUpperCase()}**):`;

        let evalPrice = (item) => typeof item === 'object' ? '—' : (item > -1 ? item : '—');

        const message = {
          title: `Price History for ${cardTitle}`,
          description: description,
          fields: [
            { name: 'USD', value: `$**${ evalPrice(data.prices?.usd) }** | $**${ evalPrice(data.prices?.usd_foil) }**`, inline: true },
            { name: 'EUR', value: `€**${ evalPrice(data.prices?.eur) }** | €**${ evalPrice(data.prices?.eur_foil) }**`, inline: true },
            { name: 'TIX', value: `**${ evalPrice(data.prices?.tix) }** tix | **${ evalPrice(data.prices?.tix_foil) }** tix`, inline: true },
          ],
          thumbnail: {
            url: thumbnailImage,
          },
          footer: {
            "text" : footerText,
          },
          deferred: true,
          // color: '#3498DB',
        };

        if (cardPrices.toString().length > 2) {
          message.url = json?.url;
          message.image = { url: 'attachment://file.jpg' };
          message.files = [imageStream];
        } else {
          if (data?.prices?.usd || data?.prices?.eur || data?.prices?.tix) {
            message.description = `No price history found for **${data.set_name}** (**${data.set.toUpperCase()}**).`;
          } else {
            message.description = `No prices found for **${data.set_name}** (**${data.set.toUpperCase()}**).`;
            message.fields = [];

            const response_2 = await fetch(data.prints_search_uri);
            let printings = await response_2.json();

            let sets = printings['data'].map(({ set }) => set);
            if (sets.length > 0) {
              let url = `https://scryfall.com/search?as=grid&order=released&q=%21%22${data?.name.replace(/\s/g, '%20')}%22&unique=prints`;
              message.description += `\nHowever, [${sets.length-1} other available printings](${url}) were found.`;
            }
          }
        }

        // return message;
        return { deferred: true, data: message };
      } else if (prices !== true && decks == true) {
        // Initial Deferred Response
        await client.api.interactions(interaction.id, interaction.token).callback.post({
          data: { type: INTERACTION_RESPONSE_TYPE.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE },
        });

        const response_1 = name
          ? await fetch(config.api
            + 'metagame/cards?q='
            + (name ? `name=${name}+` : '')
            + (query || '')
          ).then(res => res.json())
          : [];
        if (!response_1?.parameters && name) {
          return {
            ...ERROR_DEFAULTS,
            description: response_1.details + '\n' +
            response_1?.warnings
                ? '```\n' + response_1.warnings.join('\n') + '\n```'
                : ''
          };
        }

        const response_2 = await fetch(config.api + 'metagame')
          .then(res => res.json());
        if (!response_2?.parameters) {
          return {
            ...ERROR_DEFAULTS,
            description: response_2.details + '\n' +
              response_2?.warnings
                ? '```\n' + response_2.warnings.join('\n') + '\n```'
                : ''
          };
        }

        const { time_interval } = response_1?.parameters || response_2?.parameters;

        if (!name) {
          const data = Object.values(response_2.data)
            .map((obj, i) => {
              const cardsData = obj.cards.data.map((card, i) => ({
                'Meta %': card.percentage,
                'Qty': card.count,
                'Avg': card.average,
                'Card': card.cardname,
              }));
              const table = formatMonospaceTable(cardsData, 16, true)[0].filter(x => x);
              return table.join('\n');
            })
            .filter(Boolean);
          return {
            deferred: true,
            data: await formatListAsPages(
              data
                .map((page, i) => {
                  const format = Object.keys(response_2.data)[i];
                  return [
                    {
                      name: [
                        'Top cards in', format.charAt(0).toUpperCase() + format.slice(1),
                        'in the last', time_interval, time_interval == 1 ? 'day' : 'days'
                      ].join(' ') + ':',
                      value: `\`\`\`diff\n${ page }\n\`\`\``
                    }
                  ];
                }).flat(1),
              { title: 'Cards' }, 0, 2, 'fields',
            )
          }
        }

        const data = Object.values(response_1.data)
          .map((obj, i) => {
            const format = Object.keys(response_1.data)[i];
            const formatData = response_1.data[format];
            if (formatData.archetypes.count > 0) {
              return { format, ...formatData.archetypes };
            }
          })
          .filter(Boolean);

        const archetypes = data
          .map(_format => {
            const metagameData = response_2
              .data[_format.format]
              .archetypes.data;
            const formatData = _format.data.map((archetype, i) => ({
              'Meta %': ((parseFloat(metagameData
                .filter(_obj => _obj.uid == archetype.uid)[0]
                .percentage) / 100) * (parseFloat(archetype.percentage) / 100)
                * 100).toFixed(2) + '%',
              'Qty': archetype.count,
              'Deck': archetype.displayName,
            }));
            
            const table = formatMonospaceTable(formatData, 32, true)[0].filter(x => x);
            const summary = formatMonospaceTable(
              [
                ...formatData,
                {
                  'Meta %': _format.percentage,
                  'Qty': _format.count,
                  'Deck': 'Total',
                }
              ], table.length - 3, true)[0]
              .filter(x => x)
              .slice(table.length - 1);

            return [...table, ' ..' + summary[0].slice(3), summary[1]].join('\n');
          });

        return {
          deferred: true,
          data: await formatListAsPages(
            archetypes
              .map((page, i) => {
                const format = data[i].format;
                return [
                  {
                    name: 'Conditions:',
                    value: [
                        'Show only decks whose contents satisfy:',
                        `\`\`\`diff\nWhere ${
                          response_1.conditions
                            .map(condition =>
                              condition?.split(' and ').join('\n and ')
                            ).join(',\nWhere ')
                        }\n\`\`\``
                      ].join('\n')
                  },
                  {
                    name: [
                      'Results in', format.charAt(0).toUpperCase() + format.slice(1),
                      'in the last', time_interval, time_interval == 1 ? 'day' : 'days'
                    ].join(' ') + ':',
                    value: `\`\`\`diff\n${ page }\n\`\`\``
                  }
                ];
              }).flat(1),
            {
              title: 'Cards',
              description: '**Note:** Only showing results matching against query.'
            }, 0, 2, 'fields',
          )
        };
      }
    }  catch (error) {
      console.error(
        chalk.cyan(`[/card]`)+
        chalk.grey('\n>> ') + chalk.red(`Error: ${error.stack}`)
      );
      return {
        title: 'Error',
        description: error.message,
        color: 0xe74c3c,
        ephemeral: true,
      };
    }
  },
};

export default Card;
