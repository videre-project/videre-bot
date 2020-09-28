import { Bot } from '../bot'

function useEmote(client: Bot, emote: string | string[]) {
  if (!emote) return

  const emoji = client.emojis.cache.find(({ name }) =>
    name === emote || emote.includes(name)
  )

  return emoji
}

export default useEmote
