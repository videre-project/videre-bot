import fetch from 'node-fetch';

import config from 'config';
import { ERROR_DEFAULTS, MTGO } from 'constants';

import { dynamicSortMultiple } from 'utils/database';
import { formatListAsPages } from 'utils/discord';
import { getNumberWithOrdinal } from 'utils/magic';

const Catalog = {
    name: 'catalog',
    description: "(WIP) Displays most recent events by format, type, and/or date.",
    type: 'global',
    options: [
      {
        name: 'format',
        description: 'A specific format to return events from.',
        type: 'string',
        choices: MTGO.FORMATS,
      },
      {
        name: 'event_type',
        description: 'A specific event type to return events from.',
        type: 'string',
        choices: MTGO.EVENT_TYPES,
      },
      {
        name: 'date',
        description: 'A specific date to return events from in MM/DD/YY format.',
        type: 'string',
      },
      {
        name: 'time_interval',
        description: '(Optional) Amount of days to fetch results from; overrides date option',
        type: 'integer',
    },
    ],
    async execute({ params }) {
        try {
            const response = await fetch(config.api + 'metagame/events?' + params)
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
            if (!response?.data) return { ...ERROR_DEFAULTS, description: `No events found.` };

            const time_interval = response.parameters.time_interval;

            return formatListAsPages(
                Object.values(response.data)
                    .map(obj => obj.events.data).flat(1)
                    .sort(dynamicSortMultiple('-date', 'uid'))
                    .map(({ uid, url, date }, i) => (
                        `**${i + 1}.**${
                            new Array((
                                Object.values(response.data)
                                    .map(obj => obj.events.count)
                                    .reduce((a, b) => a + b, 0)
                            ).toString().length - (i + 1).toString().length + 1)
                            .join(" ")
                        }\`${uid}\` • [**${
                            url.split('https://magic.wizards.com/en/articles/archive/mtgo-standings/')[1]
                                .toLowerCase()
                                .replace(/[0-9]/g, '')
                                .split('-')
                                .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                                .join(' ')
                        } (${
                            (new Date(date)).toDateString()
                            .split(' ').map((s, i) => {
                                if (i == 0) return;
                                return (isNaN(s) || `${s}`.length > 2) ? s : getNumberWithOrdinal(s) + ',';
                            }).filter(Boolean).join(' ')
                        })**](${url})`
                    )),
                {
                    title: "Catalog",
                    description: `**Top events (from the last ${time_interval} ${time_interval === 1 ? 'day' : 'days'}):**\n`,
                },
                0, 10, 'description',
            );

        } catch (error) {

            return {
                ...ERROR_DEFAULTS,
                description: 'An error occured while while retrieving events catalog.',
            }

        }
    },
};

export default Catalog;
