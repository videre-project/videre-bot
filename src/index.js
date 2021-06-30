import chalk from 'chalk';
import Bot from 'bot';

const bot = new Bot();
console.info(`${chalk.cyanBright('[Bot]')} Starting bot...`);
bot.start();
