import chalk from 'chalk';
import fetch from 'node-fetch';

import config from 'config';
import { ERROR_DEFAULTS, ERROR_MESSAGE } from 'constants';

import { CommandInteractionOptionResolver, MessageActionRow, MessageAttachment, MessageButton } from 'discord.js';

import { toPascalCase } from '@videre/database';
import { MTGO } from '@videre/magic';

import { logError } from 'utils/logging';
import { formatMonospaceTable } from 'utils/discord/table';
import { formatListAsPages } from 'utils/discord/interactive';

// Testing
import { validateMessage } from 'utils/discord';

const Metagame = {
  name: 'metagame',
  description: "(WIP) Displays a metagame breakdown of decks from the most recent events by format.",
  type: 'global',
  options: [
    {
      name: 'format',
      description: 'A specific format to return metagame data from. (Required)',
      type: 'string',
      required: true,
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
  ],
  async execute({ client, interaction, args }) {

    // For Button Interactions
    let slice = args?.slice ?? 0;

    try {
      // if (interaction?.componentType !== 'SELECT_MENU') {
        if (args?.slice !== undefined) await interaction.deferUpdate();
        else await interaction.deferReply();
      // }

      // Format args as url parameters for API
      const params = Object.keys(args)
        .filter(key => !['id', 'page', 'slice'].includes(key))
        .map((arg, i) =>
          `${arg}=${args[arg]}`
          // typeof(arg) == 'object'
          //   ? arg.map(_arg => Object.keys(_args)[i] + '=' + _args[_arg])
          //   : Object.keys(_args)[i] + '=' + _args[arg]
        ).join('&');

      const response = await fetch(config.api + 'metagame?' + params)
        .then(res => res.json());

      if (!response?.parameters) {
        return {
          ...ERROR_DEFAULTS,
          description: response.details + '\n' +
            response?.warnings
              ? '```\n' + response.warnings.join('\n') + '\n```'
              : ''
        };
      }

      const { format, time_interval, offset } = response.parameters;
      const date_range = response
        .data[format.toLowerCase()]
        .events.data.map(obj => obj.date)
        .sort((a, b) => (new Date(a) > new Date (b) ? 1 : -1));

      let data = response
        .data[format.toLowerCase()]
        .archetypes.data.map(obj => ({
          'Meta %': obj.percentage,
          'Qty': obj.count,
          'Archetype': obj.displayName,
        }));

      // TEMP; apply categorical overrides
      if (format === 'Modern') {
        const categories = {
          '4c Yorion': [
            ['4/5c Omnath', '5c Omnath', '(Misc)'],
            ['Blink', '(Control)'],
            ['Elementals', '(Elementals)'],
          ],
          'UR Murktide': [
            ['Murktide Regent', '(Tempo)'],
            // Same variant
            ['Blue-Red Control', 'UR Control', '(Control)'],
          ],
        };
        
        const fill_data = Object.keys(categories)
          .map(category => {
            const labels = Object.values(categories[category]);
            const filters = labels.map(i => i[0]);

            // Split data with filters
            const filtered = data
              .filter(({ Archetype }) => filters.includes(Archetype))
              .map(({ Archetype, ...rest }) => {
                if (labels.flat(1).includes(Archetype)) {
                  const override = labels
                    .filter(l => l.includes(Archetype))
                      .flat(1)
                      .slice(-1)[0];
                  
                  return { ...rest, Archetype: override };
                };
              }).filter(Boolean);

            data = data
              .filter(({ Archetype }) => !filters.includes(Archetype));

            const aggregate = (key) => filtered
              .map(obj => {
                if (key === 'Meta %')
                  return parseFloat(obj[key].replace('%', ''))
                else return obj[key];
              })
              .reduce((a, b) => a + b, 0);
            
            if (!aggregate('Qty')) return;

            const category_row = {
              'Meta %': `${aggregate('Meta %').toFixed(2)}%`,
              'Qty': aggregate('Qty'),
              'Archetype': category,
            };

            data = [...data, category_row]
              .sort((a, b) => b['Qty'] - a['Qty']);

            return { label: category, filters: filtered };
          });

        // fill_data
        //   .forEach(({ label, filters }) => {
        //     const category_row = data
        //       .filter(({ Archetype }) => Archetype === label)
        //       ?.[0];
            
        //     const idx = data
        //       .map(JSON.stringify)
        //       .indexOf(JSON.stringify(category_row));

        //     // Add category variants
        //     data = [
        //       ...data.slice(0, idx),
        //       [category_row, ...filters],
        //       ...data.slice(idx + 1, -1),
        //     ];
        //   });
      };

      // Number of days in date range
      const num_days = Math.round(
        (Math.abs(
          Date.parse(date_range[0])
          -
          Date.parse(date_range.slice(-1)[0])
        )) / (1000 * 60 * 60 * 24)
      );
          
      const pages = formatListAsPages(
        formatMonospaceTable(data, 16, true)
          .map(page => ({
            name: [
              'Top archetypes in',
              format.charAt(0).toUpperCase() + format.slice(1),
              Object.keys(response.parameters).length > 2
                ? `within a span of ${num_days} ${
                  num_days == 1 ? 'day' : 'days'
                }`
                : `in the last ${time_interval} ${
                  time_interval == 1 ? 'day' : 'days'
                }`,
            ].join(' ') + ':\n'
            + (date_range?.length
              ? '\`(' + date_range[0] + ' to ' + date_range.slice(-1)[0]
                + (offset
                  ? `; offset by ${ offset } ${ offset == 1 ? 'day' : 'days' }`
                  : '')
                + ')\`'
              : ''),
            value: `\`\`\`diff\n${ page?.join('\n') }\n\`\`\``,
          })),
        { title: 'Metagame' }, 1, 'fields',
      );

      const buttons = [
        {
          label: '<<',
          props: {
            id: '0',
            // page: 1,
            slice: 0
          },
          disabled: !Boolean(slice)
        },
        {
          label: '← Back',
          props: {
            id: '1',
            // page: Math.max(0, slice),
            slice: Math.max(0, slice - 1)
          },
          disabled: !Boolean(slice)
        },
        {
          label: 'Next →',
          props: {
            id: '2',
            // page: Math.max(0, slice + 2),
            slice: Math.max(0, slice + 1)
          },
          disabled: Math.max(0, slice + 1) == pages.length
        },
        {
          label: '>>',
          props: {
            id: '3',
            // page: pages.length,
            slice: pages.length - 1
          },
          disabled: Math.max(0, slice + 1) == pages.length
        }
      ].map(({ label, props, disabled }, i) =>
        new MessageButton()
          .setStyle('SECONDARY')
          .setLabel(label)
          .setCustomId(JSON.stringify({
            ...args, ...props
          })).setDisabled(disabled)
      );

      return {
        ...pages[slice],
        components: [
          new MessageActionRow().addComponents(...buttons)
        ],
        deferred: true
      };
    } catch (error) {
      logError(args, error, __filename);
      return ERROR_MESSAGE('An error occured while fetching metagame data.', error, interaction);
    }
  },
};

export default Metagame;