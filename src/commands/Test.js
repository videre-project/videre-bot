import chalk from 'chalk';
import { sql } from 'utils/database';

const Test = {
    name: 'test',
    description: "Test command.",
    type: 'guild',
    async execute() {
        try {
            const request = await sql`
                SELECT stats->>'record' from results
                WHERE event >= (
                    SELECT MIN(uid) FROM events
                    WHERE date::DATE >= CURRENT_DATE - ${ 7 * 3 }::INT
                ) AND url LIKE '%' || ${ '/' + 'modern' + '-' }::TEXT || '%'
                AND archetype::JSON -> 'mtggoldfish' ->> 'uid' = ${ 6181 }::TEXT
                ORDER by event desc;
            `;

            console.log(request.map(a => 
                a['?column?']
                  .split('-')
                  .reduce((a, b) => Number(a) / (Number(b) + Number(a)))
            ));

        } catch (error) {
            console.error(chalk.cyan(`[/test]`) + chalk.grey('\n>> ') + chalk.red(`Error: ${error.stack}`));
            return {
                title: 'Error',
                description: `An error occured while finding event statistics.`,
                color: 0xe74c3c,
                ephemeral: true,
            };
        }
    },
};

export default Test;
