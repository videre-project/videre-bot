import chalk from 'chalk';
import config from 'config';

import { sql } from 'utils/database';
import { formatListAsPages } from 'utils/discord';
import { getNumberWithOrdinal, formatEvent } from 'utils/magic';

const Event = {
    name: 'event',
    description: "(WIP) Displays an event by name, id, date, or search query.",
    options: [
        {
            name: 'event_id',
            description: 'A specific event id (integer) to return event results from.',
            type: 'integer',
            required: false,
        },
        {
            name: 'view',
            description: '(Optional) A visual style to format results by.',
            type: 'integer',
            required: false,
            choices: [
                { name: 'Standard View', value: 0 },
                { name: 'Decklist View', value: 1 },
                { name: 'Visual Decklist View', value: 2 },
            ],
        },
    ],
    async execute({ guilds, interaction, args }) {
        const event_id = args?.event_id;
        const view = args?.view || 0;
        try {
            if (event_id == null) return {
                title: "Error",
                description: `No \`event_id\` provided`,
                color: 0xe74c3c,
                ephemeral: true,
            };

            const request = await sql`
                SELECT * from results
                WHERE event = ${event_id}::int
                ORDER by (stats::JSON ->> 'rank')::int asc;
            `;

            if (!request[0]) return {
                title: "Error",
                description: `Event not found.`,
                color: 0xe74c3c,
                ephemeral: true,
            };

            const eventName = formatEvent(request[0].url.split("#")[0], request[0].event);

            switch (view) {
                // Standard View
                case 0:
                    return formatListAsPages(
                        request.map(({ username, url, deck, stats }) => ({
                            name: `${getNumberWithOrdinal(stats.rank)} place (${stats.record})`,
                            value: `**[${deck?.archetype}](${url})** by ${username}`
                        })), { title: eventName, url: request[0].url.split('#')[0] },
                        // Start on page 0 with 8 embed fields on each page
                        0, 8, 'fields'
                    );
                // Decklist View
                case 1:
                    return formatListAsPages(
                        await Promise.all(request.map( async ({ username, url, deck, stats }) => (
                            {
                                fields: [
                                    {
                                        name: `${getNumberWithOrdinal(stats.rank)} place (${stats.record})`,
                                        value: `**[${deck?.archetype}](${url})** by ${username}`
                                    },
                                ],
                                // Array of card objects organized by 'qty' and 'cardName' between mainboard/sideboard
                                deck: deck,
                                // Passing emojiGuild context for mana symbol emojis
                                emojiGuild: guilds.resolve(config.emojiGuild),
                            }))
                        ), { title: eventName, url: request[0].url.split('#')[0] },
                        // Start on page 0 with a decklist (processed and prettified) on each page
                        0, 1, 'decklist',
                    );
                // Visual Decklist View
                case 2:
                    //
            }

        } catch (error) {
            console.error(
                chalk.white(
                    `${chalk.blue(`[/Event]`)} args: [ ${[
                        `${chalk.grey(`event_id:`)} ${!event_id ? 'None' : chalk.yellow(event_id)}`,
                        `${chalk.grey(`view:`)} ${!view ? 'None' : chalk.yellow(view)}`,
                    ].join(', ')} ]\n>> ${chalk.red(error.stack)}`
                )
            );

            return {
                title: 'Error',
                description: 'An error occured while while retrieving events.',
                color: 0xe74c3c,
                ephemeral: true,
            }

        }
    },
};

export default Event;
