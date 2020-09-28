import Fetch from '../commands/Fetch'
import useMessage from '../utils/useMessage'

describe('!fetch', () => {
  it('Fetches and displays format metagame data.', () => {
    const msg = useMessage('!fetch')

    new Fetch().execute({ msg, args: ['modern'] })

    const [output] = msg.channel.messages
    expect(output).toBeDefined
  })
})
