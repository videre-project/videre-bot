import chalk from 'chalk';
import { MTGO, ERROR_DEFAULTS } from 'constants';
import { sql, dynamicSortMultiple } from 'utils/database';
import { formatMonospaceTable, formatListAsPages } from 'utils/discord';

const Metagame = {
    name: 'metagame',
    description: "(WIP) Displays a metagame breakdown of decks from the most recent events by format.",
    type: 'global',
    options: [
        {
            name: 'format',
            description: 'A specific format to return metagame data from',
            type: 'string',
            choices: MTGO.FORMATS,
        },
        {
            name: 'time_interval',
            description: '(Optional) Amount of days to fetch results from',
            type: 'integer',
        },
    ],
    async execute({ args }) {
        const format = args?.format;
        const time_interval = args?.time_interval || 2 * 7;

        if (args?.time_interval <= 0) return {
            ...ERROR_DEFAULTS,
            description: `Provided \`time_interval\` must be greater than 0.`
        };
        try {
            const request = await sql`
                SELECT archetype from results
                WHERE event >= (
                    SELECT MIN(uid) FROM events
                    WHERE date::DATE >= CURRENT_DATE - ${time_interval}::INT
                ) AND url LIKE '%' || ${'/' + format + '-'}::TEXT || '%'
                AND archetype::TEXT != '{}'
                ORDER by event desc;
            `;
            if (!request[0]) return {
                ...ERROR_DEFAULTS,
                description: `No metagame data was found.`
            };

            const archetypes = request.map(obj => {
                const archetype0 = obj.archetype[Object.keys(obj.archetype)[0]];
                return {
                    uid: archetype0.uid,
                    displayName: [...archetype0.alias, archetype0.displayName]
                        .filter(Boolean)[0],
                }
            });
            
            return formatListAsPages(
                formatMonospaceTable(
                    archetypes.filter((obj, i) =>
                        archetypes.findIndex(_obj => _obj.uid === obj.uid) === i
                    ).filter((_obj) => _obj.uid !== null)
                    .map(obj => ({
                        'Meta %': (archetypes.filter((_obj) => _obj.uid === obj.uid).length
                            / archetypes.length * 100).toFixed(2) + '%',
                        'Qty': archetypes.filter((_obj) => _obj.uid === obj.uid).length,
                        'Archetype': obj.displayName,
                    })).sort(dynamicSortMultiple('-Qty', 'Archetype')),
                    16, true
                ).map(page => ({
                    name: [
                        'Top archetypes in', format.charAt(0).toUpperCase() + format.slice(1),
                        'in the last', time_interval, time_interval == 1 ? 'day' : 'days'
                    ].join(' ') + ':',
                    value: `\`\`\`diff\n${page.join('\n')}\n\`\`\``,
                })),
                { title: 'Metagame' }, 0, 1, 'fields',
            );

        } catch (error) {
            console.error(
                chalk.white(
                    `${chalk.blue(`[/Metagame]`)} args: [ ${[
                        `${chalk.grey(`format:`)} ${!format ? 'None' : chalk.green(`"${format}"`)}`,
                        `${chalk.grey(`time_interval:`)} ${!time_interval ? 'None' : chalk.yellow(time_interval)}`,
                    ].join(', ')} ]\n>> ${chalk.red(error.stack)}`
                )
            );
            return {
                title: 'Error',
                description: `An error occured while fetching metagame data.`,
                color: 0xe74c3c,
                ephemeral: true,
            };
        }
    },
};

export default Metagame;
