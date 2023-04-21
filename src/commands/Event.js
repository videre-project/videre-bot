import fetch from 'node-fetch';

import config from 'config';
import { ERROR_DEFAULTS, ERROR_MESSAGE } from 'constants';

import { MessageActionRow, MessageAttachment, MessageButton, MessageSelectMenu } from 'discord.js';

import { toPascalCase, getNumberWithOrdinal, dynamicSortMultiple } from '@videre/database';
import { MTGO } from '@videre/magic';

import { getColors, formatEvent, formatDeck, drawDeck, getThumbnail } from 'utils/magic';
import { logError } from 'utils/logging';

const Event = {
  name: 'event',
  description: "(WIP) Displays an event by name, id, date, or search query.",
  type: 'global',
  options: [
    {
      name: 'format',
      description: 'A specific format to return events from.',
      type: 'string',
      choices: MTGO.FORMATS.map(format => ({
        name: toPascalCase(format),
        value: format
      })),
    },
    {
      name: 'time_interval',
      description: 'Amount of days to fetch results from. (Default 14)',
      type: 'integer',
    },
    {
      name: 'offset',
      description: 'Offset in days to shift results\' time range.',
      type: 'integer',
    },
    {
      name: 'min_date',
      description: 'Minimum date to return results from in `MM/DD/YYYY` or `YYYY/MM/DD` format.',
      type: 'string',
    },
    {
      name: 'max_date',
      description: 'Maximum date to return results from in `MM/DD/YYYY` or `YYYY/MM/DD` format.',
      type: 'string',
    },
    {
      name: 'event_id',
      description: 'A specific event id (integer) to return event results from.',
      type: 'integer',
    },
    {
      name: 'view',
      description: '(Optional) A visual style to format results by.',
      type: 'integer',
      choices: [
        { name: 'Decklist View', value: 0 },
        { name: 'Visual View', value: 1 },
      ],
    },
  ],
  async execute({ client, interaction, args }) {
    // Query
    const {
      format,
      time_interval = 30,
      offset = 0,
      min_date,
      max_date,
    } = args;

    const { event_id, view = 1 } = args;

    // For Button Interactions
    let slice = args?.slice ?? 0;

    const emojis = {
      Preliminary: '950924856952770610', // :Preliminary: Preliminary emoji
      Challenge: '950924856810143744', // :Challenge: Challenge emoji
      League: '950924856852086784', // :League: League emoji
      Premier: '950924857183453234', // :Premier: Premier emoji
    };

    try {
      const response = await fetch(config.api + 'metagame?' + [
          format
            ? `format=${format}`
            : '',
          time_interval
            ? `time_interval=${time_interval}`
            : '',
          offset
            ? `offset=${offset}`
            : '',
          min_date
            ? `min_date=${min_date}`
            : '',
          max_date
            ? `max_date=${max_date}`
            : '',
          event_id
            ? `uid=${event_id}`
            : ''
        ].filter(Boolean)
          .join('&')
      ).then(res => res.json());

      if (!response?.parameters) {
        return {
          ...ERROR_DEFAULTS,
          description: response.details + '\n' +
            response?.warnings
              ? '```\n' + response.warnings.join('\n') + '\n```'
              : ''
        };
      }

      if (event_id) {
        // if (interaction?.componentType !== 'SELECT_MENU') {
          if (args?.slice !== undefined) await interaction.deferUpdate();
          else await interaction.deferReply();
        // }

        if (interaction?.componentType === 'SELECT_MENU') {
          await interaction.deleteReply();
        }

        if (!response?.data) return { ...ERROR_DEFAULTS, description: `Event not found.` };

        const event = response?.data?.[Object.keys(response?.data)?.[0]]?.events?.data?.[0];

        const {
          date,
          url,
          type,
          uid,
          stats: { obsPlayers },
          data: _results
        } = event;
        const eventName = formatEvent(url, uid, date);

        const emojiId = emojis[type] || '950562237431578625';
        const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.webp?size=44&quality=lossless`;

        const results = _results
          .sort((a, b) => a.stats?.rank > b.stats?.rank ? 1 : -1);

        const {
          username,
          url: _url,
          deck,
          stats,
          archetype
        } = results[slice];

        let contention = 'top 32 results';
        if (obsPlayers < 32) {
          const {
            stats: {
              record: min_record
            }
          } = results.slice(-1)[0];
          contention = [
            'results',
            `X-${min_record.split('-')[1]}`,
            'and up'
          ].join(' ');
        }

        // Get Scryfall card data
        const collection = await fetch("https://api.scryfall.com/cards/collection", {
          method: "post",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "identifiers": [
              ...deck.mainboard.map(({ cardname }) => ({ "name": cardname?.split('/')[0] })),
              ...deck.sideboard.map(({ cardname }) => ({ "name": cardname?.split('/')[0] })),
            ],
          }),
        }).then(res => res.json());

        if (collection?.object === 'error') {
          throw new Error(collection.details)
        }

        let _usd = 0,
            _eur = 0,
            _tix = 0;
        [...deck.mainboard, ...deck.sideboard]
          .forEach(({
              // exact
              cardname,
              quantity
            }, i) => {
              const name = cardname.split('/')[0];
              const match = collection.data
                .filter(({ name: _name }) => _name === name)
                ?.[0];

              const { usd, eur, tix } = match?.id
                ? match.prices
                : collection.data[i].prices;

              // aggregate prices
              _usd += parseFloat(usd || 0) * quantity;
              _eur += parseFloat(eur || 0) * quantity;
              _tix += parseFloat(tix || 0) * quantity;
            });

        const price_summary = [
          `USD: $${ _usd ? _usd.toFixed(2) : '—' }`,
          `EUR: €${ _eur ? _eur.toFixed(2) : '—' }`,
          `TIX: ${ _tix ? _tix.toFixed(2) : '—' } tix`,
        ].join('  |  ');

        const fields = !Boolean(view)
          ? formatDeck(
              collection.data,
              deck,
              client,//.guilds.resolve(config.emojiGuild),
              'decklist'
            ) : null;

        const buffer = Boolean(view)
          ? await drawDeck(
              formatDeck(
                collection.data,
                deck,
                client,//.guilds.resolve(config.emojiGuild)
              ),
              // flex_width, override_width, show_quantities
              7, null, true,
              // thumbnail
              getThumbnail(deck, collection)
            )
          : null;

        const button = new MessageButton()
          .setStyle('PRIMARY')
          .setLabel(Boolean(view)
            ? 'Show Text Decklist'
            : 'Show Visual Decklist',
          ).setCustomId(JSON.stringify({
            slice,
            event_id,
            view: Boolean(view) ? 0 : 1
          })).setEmoji(Boolean(view)
            ? '837140782820622346' // :manat: tap emoji
            : '837140782804500490' // :manaq: untap emoji
          );

        // const cards_button = new MessageButton()
        //   .setStyle('SECONDARY')
        //   .setLabel('Lookup card')
        //   .setCustomId(JSON.stringify({
        //     method: 'card-lookup',
        //     slice,
        //     event_id
        //   }))
        //   .setEmoji('🔍'); // :Sideboard: Sideboard emoji

        const deck_button = new MessageButton()
          .setStyle('LINK')
          .setLabel('Open Deck Page')
          .setURL(_url)
          .setEmoji('950562237431578625'); // :MTGO: MTGO emoji

        const buttons = [
          {
            label: '<<',
            props: {
              id: '0',
              page: 1,
              slice: 0
            },
            disabled: !Boolean(slice)
          },
          {
            label: '← Back',
            props: {
              id: '1',
              page: Math.max(0, slice),
              slice: Math.max(0, slice - 1)
            },
            disabled: !Boolean(slice)
          },
          {
            label: 'Next →',
            props: {
              id: '2',
              page: Math.max(0, slice + 2),
              slice: Math.max(0, slice + 1)
            },
            disabled: Math.max(0, slice + 1) == results.length
          },
          {
            label: '>>',
            props: {
              id: '3',
              page: results.length,
              slice: results.length - 1
            },
            disabled: Math.max(0, slice + 1) == results.length
          }
        ].map(({ label, props, disabled }) =>
          new MessageButton()
            .setStyle('SECONDARY')
            .setLabel(label)
            .setCustomId(JSON.stringify({
              ...props,
              // uid: _uid
              event_id
            })).setDisabled(disabled)
        );

        const tiebreakers = Object.keys(stats.tiebreakers)
          .filter(key => key !== 'MWP')
          .map(key => {
            const val = stats.tiebreakers[key];
            const matches = stats.record
              .split('-')
              .reduce((a, b) =>
                parseInt(a) + parseInt(b)
              );

            let arr = [];
            const val_1 = parseFloat(stats.tiebreakers[key]) / 100;
            if (key.includes('GWP')) {
              for (let i = 2 * matches; i < 2.85 * matches; i++) {
                const val_0 = (i * val_1);
                const val_2 = Math.abs(i - val_0);
                let residual = val_0 % 1;
                // let residual = Math.abs(
                //   (val_0 / (val_0 + val_2))
                //   - val_1
                // );
                if (residual > .5) residual = 1 - residual;

                arr.push({
                  i: i,
                  record: [
                    Math.round(val_0),
                    Math.round(val_2)
                  ].join('–'),
                  res: residual
                });
              };
            } else {
              let val_0 = val_1 * matches;
              const val_2 = Math.abs(matches - val_0);

              arr = [{
                i: 0,
                record: [
                  val_0.toFixed(1),
                  val_2.toFixed(1)
                ].join('–'),
                res: 0
              }];
            }

            arr = arr.sort(dynamicSortMultiple('res', 'i'));

            return {
              name: key,
              value: `**${arr[0].record}** (${val})`,
              inline: true
            };
          });

        return {
          embeds: [{
            author: {
              name: `${eventName}`,
              icon_url: emojiUrl,
              url: url
            },
            title: `${getNumberWithOrdinal(stats.rank)} place (${stats.record})\n{COLORS} **${archetype?.displayName}** by ${username}`
              .replace('{COLORS}', getColors(collection.data, client)),
            url: _url,
            description: Boolean(view)
              ? '**Tiebreaker Stats:**'
              : '',
              // : '**Text Decklist:**',
            fields: !Boolean(view)
              ? fields
              : tiebreakers,
            image: Boolean(view)
              ? { url: 'attachment://canvas.png' }
              : null,
            footer: {
              text: price_summary + [
                `\nShowing ${ contention }`,
                `Page ${ slice + 1 } of ${ obsPlayers }`
              ].join(' • ')
            }
          }],
          files: Boolean(view)
            ? [new MessageAttachment(buffer, 'canvas.png')]
            : null,
          components: [
            new MessageActionRow()
              .addComponents(
                button,
                // cards_button,
                deck_button
              ),
            new MessageActionRow()
              .addComponents(...buttons)
          ],
          deferred: true
        }
      } else {
        if (!response?.data) return { ...ERROR_DEFAULTS, description: `No events found.` };

        const events = Object.keys(response?.data)
          .map(_format => response.data[_format].events.data)
          .flat(1)
          .sort((a, b) => (new Date(a.date) < new Date (b.date) ? 1 : -1));

        const data = events
          .map(event => {
            const {
              date,
              type,
              url,
              uid,
              data: results,
              stats: { approxPlayers }
            } = event;
            const eventName = formatEvent(url, uid, date);

            const label = eventName
              .replace(/\s+\(.*/g, '');

            const description = [
              eventName
                .match(/(?<=\().+?(?=\))/g)[0],
              `~${approxPlayers || 0} Players`,
              `${results?.length || 0} Results`
            ].join(' | ');

            return {
              label,
              description,
              value: `${uid}`,
              emoji: emojis[type] ?? '950562237431578625' // :mtgo: MTGO emoji
            };
          }).filter(Boolean);
            
        const options = data.slice(slice * 25, (slice + 1) * 25);
        const numPages = Math.ceil(data?.length / 25);

        const buttons = [
          {
            label: '<<',
            props: {
              id: '0',
              page: 1,
              slice: 0
            },
            disabled: !Boolean(slice)
          },
          {
            label: '← Back',
            props: {
              id: '1',
              page: Math.max(0, slice),
              slice: Math.max(0, slice - 1)
            },
            disabled: !Boolean(slice)
          },
          {
            label: 'Next →',
            props: {
              id: '2',
              page: Math.max(0, slice + 2),
              slice: Math.max(0, slice + 1)
            },
            disabled: Math.max(0, slice + 1) == numPages
          },
          {
            label: '>>',
            props: {
              id: '3',
              page: numPages,
              slice: numPages - 1
            },
            disabled: Math.max(0, slice + 1) == numPages
          }
        ].map(({ label, props, disabled }) =>
          new MessageButton()
            .setStyle('SECONDARY')
            .setLabel(label)
            .setCustomId(JSON.stringify({
              ...response.parameters,
              ...props
            })).setDisabled(disabled)
        );

        return {
          content: 'Select an event:',
          components: [
            new MessageActionRow().addComponents(
              new MessageSelectMenu()
                .setCustomId('event_id')
                .setPlaceholder(`Nothing Selected • Page ${ slice + 1 } of ${ numPages }`)
                .addOptions(options),
            ),
            new MessageActionRow().addComponents(buttons)
          ],
        };
      }

    } catch (error) {
      logError(args, error, __filename);
      return ERROR_MESSAGE('An error occured while fetching event data.', error, interaction);
      // return {
      //   ...ERROR_DEFAULTS,
      //   description: 'An error occured while while retrieving events.',
      // };
    }
  },
};

export default Event;