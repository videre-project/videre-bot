import { Bot } from '../bot'
import { IMessage } from '../types'
import config from '../config'

export async function run(client: Bot, msg: IMessage) {
  if (msg.author.bot || !msg.content.startsWith('!')) return

  if (!config.isProduction) console.log(`${msg.author.username}#${msg.author.discriminator} >> ${msg.content}`)

  const args = msg.content.substring(1).split(' ')
  const cmdName = args.shift().toLowerCase()
  const command = client.commands.find(cmd => cmd.name === cmdName)

  if (command) command.execute({ client, msg, args })
}
