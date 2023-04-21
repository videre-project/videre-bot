import chalk from 'chalk';
import { fetch } from 'fetch-h2';
import { Client, Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { resolve } from 'path';

import { validateCommand } from 'utils/discord';

import { CLIENT_INTENTS } from 'constants';
import config from 'config';

// List of which commands were registered for the respective command types.
let globalCommands = [];
let guildCommands = [];

// Count of commands that were patched, posted, or deleted.
// let updatedCommands = 0;
// let registeredCommands = 0;
// let removedCommands = 0;

/**
 * An extended `Client` to support slash-command interactions and events.
 */
class Bot extends Client {
  constructor({ ...rest }) {
    super({
      intents: CLIENT_INTENTS,
      partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
      ...rest
    });
  }

  /**
   * Loads and registers events from the events folder.
   */
  loadEvents() {
    if (!this.events) this.events = new Collection();

    try {
      const files = readdirSync(resolve(__dirname, '../events'));

      for (const file of files) {
        const event = require(resolve(__dirname, '../events', file)).default;

        this.on(event.name, (...args) => event.execute(this, ...args));

        this.events.set(event.name, event);
      }

      console.info(`${chalk.cyanBright('[Bot]')} ${files.length} events loaded`);

      return this.events;
    } catch (error) {
      console.error(chalk.white(`${chalk.red(`[bot/index#loadEvents]`)}\n>> ${chalk.red(error.stack)}`));
    }
  }

  /**
   * Loads and registers commands from the commands folder.
   */
  loadCommands() {
    if (!this.commands) this.commands = new Collection();

    try {
      const files = readdirSync(resolve(__dirname, '../commands'));
      let hiddenCommands = [];

      for (const file of files) {
        const command = require(resolve(__dirname, '../commands', file)).default;
        if (command?.type !== 'hidden') {
          // Register command
          this.commands.set(command.name, command);
          // Add command to global commands list
          if (command?.type === 'global') globalCommands.push(command.name);
          // Add command to guild Commands list
          else if (config.guild) guildCommands.push(command.name);
        // Hide command
        } else hiddenCommands.push(command.name);
      }

      if (hiddenCommands.length > 0) {
        console.info(`${chalk.cyanBright('[Bot]')} ${hiddenCommands.length} commands hidden`);
      }

      console.info(`${chalk.cyanBright('[Bot]')} ${files.length} commands loaded`);

      return this.commands;
    } catch (error) {
      console.error(chalk.white(`${chalk.red(`[bot/index#loadCommands]`)}\n>> ${chalk.red(error.stack)}`));
    }
  }

  /**
   * Loads and registers interactions with Discord remote
   */
  async loadInteractions() {
    try {
      const global_url = `/applications/${this.user.id}/commands`;

      await fetch(`https://discord.com/api/v9${global_url}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${config.token}`,
          'User-Agent': 'Videre Project Discord Bot',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          this.commands
            .filter(({ name }) => globalCommands.includes(name))
            .map(validateCommand)
        ),
      });

      const guild_url = `/applications/${this.user.id}/guilds/${config.guild}/commands`;

      await fetch(`https://discord.com/api/v9${guild_url}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${config.token}`,
          'User-Agent': 'Videre Project Discord Bot',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          this.commands
            .filter(({ name }) => guildCommands.includes(name))
            .map(validateCommand)
        ),
      });

      console.info(`${chalk.cyanBright('[Bot]')} Updated interactions`);
    } catch (error) {
      console.error(`bot#loadInteractions >> ${error.stack}`);
    }
  }

  /**
   * Loads and starts up the bot.
   */
  async start() {
    try {
      // Hide experimental warnings
      process.env.NODE_NO_WARNINGS = 1;

      this.loadEvents();
      this.loadCommands();

      if (process.env.NODE_ENV !== 'test') {
        await this.login(config.token);
        await this.loadInteractions();

        this.listeners = new Collection();
      }

      // Fetch all emoji guilds.
      [
        '772093785176801310', // Videre Discord
        '922909415118614538' // Emoji Discord 1
      ].forEach(id => this.guilds.resolve(id));

      console.info(`${chalk.cyanBright('[Bot]')} Bot is now online`);

    } catch (error) {
      console.error(chalk.white(`${chalk.red(`[bot#start]`)}\n>> ${chalk.red(error.stack)}`));
    }
  }
}

export default Bot;
