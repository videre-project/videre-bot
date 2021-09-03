import fetch from 'node-fetch';

import config from 'config';
import { ERROR_DEFAULTS, INTERACTION_RESPONSE_TYPE } from 'constants';

import { formatListAsPages } from 'utils/discord';
import { getNumberWithOrdinal, formatEvent } from 'utils/magic';

const Event = {
    name: 'event',
    description: "(WIP) Displays an event by name, id, date, or search query.",
    type: 'global',
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
            const response = await fetch(config.api + 'metagame/events?uid=' + event_id)
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
            if (!response?.data) return { ...ERROR_DEFAULTS, description: `Event not found.` };

            const event = response?.data?.[Object.keys(response?.data)?.[0]]?.events?.data?.[0];

            const { date, url, uid, data: results } = event;
            const eventName = formatEvent(url, uid, date);

            switch (view) {
                /**
                 * Decklist View
                 */
                case 0:
                    return formatListAsPages(
                        await Promise.all(results.map( async ({ username, url: _url, deck, stats, archetype }) => (
                            {
                                author: { name: eventName, url: url },
                                title: [
                                    `${getNumberWithOrdinal(stats.rank)} place (${stats.record})`,
                                    `{COLORS} **${archetype?.displayName}** by ${username}`,
                                ].join('\n'),
                                url: _url,
                                deck: deck,
                                emojiGuild: client.guilds.resolve(config.emojiGuild),
                            }))
                        ), undefined,
                        0, 1, 'decklist',
                    );
                /**
                 * Visual View
                 */
                case 1:
                    // Initial Deferred Response
                    await client.api.interactions(interaction.id, interaction.token).callback.post({
                        data: { type: INTERACTION_RESPONSE_TYPE.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE },
                    });

                    const output = await formatListAsPages(
                        await Promise.all(results.map( async ({ username, url: _url, deck, stats, archetype }) => (
                            {
                                author: { name: eventName, url: url },
                                title: `${getNumberWithOrdinal(stats.rank)} place (${stats.record})\n**${archetype?.displayName}** by ${username}`,
                                url: _url,
                                deck: deck,
                                emojiGuild: client.guilds.resolve(config.emojiGuild),
                            }))
                        ), undefined,
                        0, 1, 'visual_decklist',
                    );
                    return { deferred: true, data: output };
                    // return output;
            }

        } catch (error) {

            return {
                ...ERROR_DEFAULTS,
                description: 'An error occured while while retrieving events.',
            }

        }
    },
};

export default Event;
