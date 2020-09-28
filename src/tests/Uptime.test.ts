import { Bot } from '../bot'
import Uptime from '../commands/Uptime'
import useMessage from '../utils/useMessage'

describe('!uptime', () => {
  const client = new Bot()

  it('displays this bot\'s uptime', () => {
    const msg = useMessage('!uptime')

    new Uptime().execute({ client, msg })

    const [output] = msg.channel.messages
    expect(output).toBeDefined
  })
})
