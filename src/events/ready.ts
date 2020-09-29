import { Bot } from '../bot'

export async function run(client: Bot) {
  client.user.setActivity('with Magic | !help')
  console.log(`Connected as ${client.user.tag}`)
}
