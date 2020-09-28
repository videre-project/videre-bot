import { ICommand, ICommandArgs } from '../types'

class Help implements ICommand {
  public name = 'help'
  public description = 'Displays a list of this bot\'s commands.'

  execute({ client, msg }: ICommandArgs) {
    try {
      const embed = {
        title: 'Commands',
        description: 'Here are the commands that I can execute:',
        color: 0x3498DB,
        timestamp: new Date(),
        footer: {
          text: '!help'
        },
        fields: client.commands.map(({ name, args, description }) => {
          return {
            name: `!${name}${args ? args.map((arg: string) => ` \`${arg}\``) : ''}`,
            value: description,
          }
        }),
      }

      return msg.channel.send({ embed })
    } catch (error) {
      console.error(`${msg.author.username}: ${msg.content} >> ${error.stack}`)
      return msg.channel.send(`An error occured while listing commands.\n\`${error.message}\``)
    }
  }
}

export default Help
