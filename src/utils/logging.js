import chalk from 'chalk';

export function logError(args, error, filename) {
  const timestamp = new Date().toISOString()
  .replace(/T/, ' ')
  .replace(/\..+/, '')
  + ' UTC';
  const command = require('path')
    .basename(filename)
    .split('.')[0];
  const _args = Object.keys(args)
    .map(key => {
      return [
        chalk.grey(key),
        args[key]
      ];
    });

  console.error(
    chalk.cyan(`[/${command}]`)
    + chalk.grey(
      chalk.bold(' @ ')
      + timestamp
    ) + '\n   Ran with args:'
  );
  Object.keys(args)
    .forEach(arg => {
      const _arg = args[arg];
      console.error(
        '   ', chalk.grey(arg + ':'),
        typeof _arg === 'string'
          ? chalk.green(`"${_arg}"`)
          : (typeof _arg === 'number'
            ? chalk.yellow(_arg)
            : _arg)
      );
    });
  console.error(chalk.grey('>> ') + chalk.red(`Error: ${error.stack}`));
}