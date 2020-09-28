import { Bot } from '../bot'
import { Message, Guild, Role } from 'discord.js'

export interface IAuthor {
  id: string
  username: string
  discriminator: string
  bot?: boolean
}

export interface IChannel {
  id: string
  messages: IMessage[]
  send?: (content: IMessage['content'] | IMessage['embed']) => any
  edit?: (content: IMessage['content'] | IMessage['embed']) => any
}

export interface IMessage {
  author: IAuthor
  channel: IChannel
  embed?: object
  content?: string
  guild?: Guild
  member?: Message['member']
  roles?: Role[]
}

export interface ICommandArgs {
  client?: Bot
  msg?: IMessage
  args?: string[]
}

export interface ICommand {
  name: string
  description: string
  args?: string[]
  execute({ client, msg, args }: ICommandArgs): void | Promise<void>
}
