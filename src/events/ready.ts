import { Bot } from '../bot'

export async function run(client: Bot) {
  client.user.setActivity('VidereProject.com | !help')
  console.log(`Connected as ${client.user.tag}`)
}
