import chalk from 'chalk';
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
let updatedCommands = 0;
let registeredCommands = 0;
let removedCommands = 0;

/**
 * An extended `Client` to support slash-command interactions and events.
 */
class Bot extends Client {
  constructor({ ...rest }) {
    super({ intents: CLIENT_INTENTS, ...rest });
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
   * Loads and registers slash command interactions with Discord remote
   */
  async loadInteractions() {
    console.info(`${chalk.cyanBright('[Bot]')} Updating slash commands...`);
    // Get remote targets
    const globalRemote = () => this.api.applications(this.user.id);
    const guildRemote = () =>
      config.guild
        ? this.api.applications(this.user.id).guilds(config.guild)
        : undefined;

    // Get remote cache
    const globalCache = await globalRemote().commands.get();
    const guildCache = await guildRemote().commands.get();

    // Update remote
    await Promise.all(
      this.commands.map(async command => {
        // Validate command props
        const data = validateCommand(command);

        if (globalCommands.includes(command.name)) {
          const globalCached = globalCache?.find(({ name }) => name === command.name);
          if (globalCached?.id) {
            if(globalCached?.name !== validateCommand(command)?.name || globalCached?.description !== validateCommand(command)?.description || JSON.stringify(globalCached?.options) !== JSON.stringify(validateCommand(command)?.options)) {
              updatedCommands++;
              await globalRemote().commands(globalCached.id).patch({ data });
            }
          } else {
            registeredCommands++;
            await globalRemote().commands.post({ data });
          }
        } else if (config.guild) {
          const guildCached = guildCache?.find(({ name }) => name === command.name);
          if (guildCached?.id) {
            if(guildCached?.name !== validateCommand(command)?.name || guildCached?.description !== validateCommand(command)?.description || JSON.stringify(guildCached?.options) !== JSON.stringify(validateCommand(command)?.options)) {
              updatedCommands++;
              await guildRemote().commands(guildCached.id).patch({ data });
            }
          } else {
            registeredCommands++;
            await guildRemote().commands.post({ data });
          }
        }
      })
    );

    // Purge removed global commands
    if (globalCache) await Promise.all(
      globalCache.map(async command => {
        const exists = this.commands.get(command.name);
        if (!exists || !globalCommands.includes(command.name)) {
          removedCommands++;
          await globalRemote().commands(command.id).delete();
        }
      })
    );

    // Purge removed guild commands
    if (guildCache) await Promise.all(
      guildCache.map(async command => {
        const exists = this.commands.get(command.name);
        if (!exists || !guildCommands.includes(command.name)) {
          removedCommands++;
          await guildRemote().commands(command.id).delete();
        }
      })
    );

    if (updatedCommands > 0) {
      console.info(`${chalk.cyanBright('[Bot]')} ${updatedCommands} ${updatedCommands == 1 ? 'command' : 'commands'} updated`);
    }
    if (registeredCommands > 0) {
      console.info(`${chalk.cyanBright('[Bot]')} ${registeredCommands} ${registeredCommands == 1 ? 'command' : 'commands'} registered`);
    }
    if (removedCommands > 0) {
      console.info(`${chalk.cyanBright('[Bot]')} ${removedCommands} ${removedCommands == 1 ? 'command' : 'commands'} removed`);
    }
    if (updatedCommands + registeredCommands + removedCommands === 0) {
      console.info(`${chalk.cyanBright('[Bot]')} No commands changed`);
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

      console.info(`${chalk.cyanBright('[Bot]')} Bot is now online`);

    } catch (error) {
      console.error(chalk.white(`${chalk.red(`[bot/index#start]`)}\n>> ${chalk.red(error.stack)}`));
    }
  }
}

export default Bot;
