import dotenv from 'dotenv';

dotenv.config();

/**
 * Bot config vars
 */
const config = {
  // Discord bot prefix
  prefix: process.env.PREFIX || '!',
  // Discord bot token
  token: process.env.TOKEN,
  // Server for local testing of slash commands
  guild: process.env.GUILD,
  // Server for mana symbol emojis
  // emojiGuild: process.env.EMOJI_GUILD,
  // Database connection string
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:videre@127.0.0.1:5432/postgres',
  // API URL
  api: 'http://localhost:5001/' //process.env.API_URL || 'http://localhost:3000/'
};

export default config;