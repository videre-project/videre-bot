import { Bot } from '../bot'

it('runs without crashing', () => {
  const client: Bot = new Bot()
  client.destroy()
})
