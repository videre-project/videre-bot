import chalk from 'chalk';
import { ERROR_DEFAULTS, MTGO } from 'constants';
import { sql, dynamicSortMultiple } from 'utils/database';
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
    async execute({ client, interaction, args }) {
        const format = args?.format;
        const event_type = args?.event_type;
        const date = args?.date;
        const time_interval = args?.time_interval;
        try {
            const request = (!format && !event_type && !date)
                ? await sql`SELECT * FROM events ORDER by uid desc LIMIT 100;`
                : await sql.unsafe(`
                    SELECT * FROM events
                    WHERE ${[
                        format ? `format = '${format.charAt(0).toUpperCase() + format.slice(1)}'` : '',
                        event_type ? `type = '${event_type.charAt(0).toUpperCase() + event_type.slice(1)}'` : '',
                        time_interval ? `date::DATE >= CURRENT_DATE - ${time_interval}::INT` : (
                            date ? `date = '${date}'` : ''
                        ),
                    ].filter(Boolean).join(' AND ')}
                    ORDER by uid desc
                    LIMIT 100
                ;`);
            if (!request[0]) return { ...ERROR_DEFAULTS, description: `No events found.` };
            const minDate = request.map(obj => obj.date)
                .sort((a, b) => new Date(a) > new Date(b) ? 1 : -1)[0];
            const range = ((new Date().getTime() - new Date(minDate).getTime()) / (1000 * 3600 * 24))
                .toFixed(0);

            return formatListAsPages(
                request
                .map(obj => ({date: new Date(obj.date), ...obj}))
                .sort(dynamicSortMultiple('-date', 'uid'))
                .map(({ uid, uri, date }, i) => (
                    `**${i + 1}.**${
                        new Array((request.length).toString().length - (i + 1).toString().length + 1)
                            .join(" ")
                    }\`${uid}\` • [**${
                        uri.toString()
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
                    })**](https://magic.wizards.com/en/articles/archive/mtgo-standings/${uri})`
                )),
                {
                    title: "Catalog",
                    description: `**Top events (from the last ${range} ${range === 1 ? 'day' : 'days'}):**\n`,
                },
                0, 10, 'description',
            );

        } catch (error) {
            console.error(
                chalk.white(
                    `${chalk.blue(`[/Catalog]`)} args: [ ${[
                        `${chalk.grey(`format:`)} ${!format ? 'None' : chalk.yellow(format)}`,
                        `${chalk.grey(`event_type:`)} ${!event_type ? 'None' : chalk.yellow(event_type)}`,
                        `${chalk.grey(`date:`)} ${!date ? 'None' : chalk.yellow(date)}`,,
                    ].join(', ')} ]\n>> ${chalk.red(error.stack)}`
                )
            );

            return {
                ...ERROR_DEFAULTS,
                description: 'An error occured while while retrieving events catalog.',
            }

        }
    },
};

export default Catalog;
