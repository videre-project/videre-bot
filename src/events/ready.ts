import { Bot } from '../bot'

export async function run(client: Bot) {
  client.user.setActivity('!fetch <format>')
  console.log(`Connected as ${client.user.tag}`)
}
