import { Bot } from '../bot'
import Help from '../commands/Help'
import useMessage from '../utils/useMessage'

describe('!help', () => {
  const client = new Bot()

  it('lists commands', () => {
    const msg = useMessage('!help')

    new Help().execute({ client, msg })

    const [output] = msg.channel.messages
    expect(output).toBeDefined
  })
})
