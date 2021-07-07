import chalk from 'chalk';
import config from 'config';

import { ERROR_DEFAULTS, INTERACTION_RESPONSE_TYPE } from 'constants';

import { sql } from 'utils/database';
import { formatListAsPages } from 'utils/discord';
import { getNumberWithOrdinal, formatEvent } from 'utils/magic';

const Event = {
    name: 'event',
    description: "(WIP) Displays an event by name, id, date, or search query.",
    type: 'guild',
    options: [
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
        const event_id = args?.event_id;
        const view = args?.view || 0;
        try {
            if (event_id == null) return {
                ...ERROR_DEFAULTS,
                description: `No \`event_id\` provided`,
            };

            const request = await sql`
                SELECT * from results
                WHERE event = ${event_id}::int
                ORDER by (stats::JSON ->> 'rank')::int asc;
            `;

            const date = await sql`
                SELECT date from events
                WHERE uid = ${event_id}::int;
            `;

            if (!request[0]) return {
                ...ERROR_DEFAULTS,
                description: `Event not found.`,
            };

            const eventName = formatEvent(request[0].url.split("#")[0], request[0].event, date[0].date);

            switch (view) {
                // Decklist View
                case 0:
                    return formatListAsPages(
                        await Promise.all(request.map( async ({ username, url, deck, stats }) => (
                            {
                                author: { name: eventName, url: request[0].url.split('#')[0] },
                                title: `${getNumberWithOrdinal(stats.rank)} place (${stats.record})\n**${deck?.archetype}** by ${username}`,
                                url: url,
                                deck: deck,
                                // Passing emojiGuild context for mana symbol emojis
                                emojiGuild: client.guilds.resolve(config.emojiGuild),
                            }))
                        ), undefined,
                        // Start on page 0 with a decklist (processed and prettified) on each page
                        0, 1, 'decklist',
                    );
                // Visual Decklist View
                case 1:
                    // Initial Deferred Response
                    await client.api.interactions(interaction.id, interaction.token).callback.post({
                        data: { type: INTERACTION_RESPONSE_TYPE.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE },
                    });

                    const output = await formatListAsPages(
                        await Promise.all(request.map( async ({ username, url, deck, stats }) => (
                            {
                                author: { name: eventName, url: request[0].url.split('#')[0] },
                                title: `${getNumberWithOrdinal(stats.rank)} place (${stats.record})\n**${deck?.archetype}** by ${username}`,
                                url: url,
                                deck: deck,
                                // Passing emojiGuild context for mana symbol emojis
                                emojiGuild: client.guilds.resolve(config.emojiGuild),
                            }))
                        ), undefined,
                        // Start on page 0 with a decklist (processed and prettified) on each page
                        0, 1, 'visual_decklist',
                    );
                    return { deferred: true, data: output };
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
                ...ERROR_DEFAULTS,
                description: 'An error occured while while retrieving events.',
            }

        }
    },
};

export default Event;
