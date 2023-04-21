import chalk from 'chalk';
import Bot from 'bot';

import { CLI_CLEAR_CONSOLE } from '@videre/cli';

import syncHeartbeat from 'heartbeat';

const bot = new Bot();

CLI_CLEAR_CONSOLE();
console.info(`${chalk.cyanBright('[Bot]')} Starting bot...`);
bot.start();

syncHeartbeat(bot);