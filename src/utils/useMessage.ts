import { IMessage } from '../types'

function useMessage(content: IMessage['content']) {
  return {
    content,
    author: {
      id: 'test',
      username: 'TestUser',
      discriminator: '1234'
    },
    channel: {
      id: 'testID',
      messages: [],
      send(content: IMessage['content']) {
        return this.messages.push(content)
      }
    }
  }
}

export default useMessage
