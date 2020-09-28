import { ICommand } from '../types'

class Uptime implements ICommand {
  public name = 'uptime'
  public description = 'Responds with this bot\'s current uptime.'

  execute({ client, msg }) {
    try {
      let totalSeconds = (client.uptime / 1000)
      let days = Math.floor(totalSeconds / 86400)
      let hours = Math.floor(totalSeconds / 3600)

      totalSeconds %= 3600

      let minutes = Math.floor(totalSeconds / 60)
      let seconds = totalSeconds % 60

      const embed = {
        title: 'Uptime',
        description: `${days.toFixed(0)} days, ${hours.toFixed(0)} hours, ${minutes.toFixed(0)} minutes and ${seconds.toFixed(0)} seconds`,
        color: 0x3498DB,
        timestamp: new Date(),
        footer: {
          text: '!uptime'
        },
      }

      return msg.channel.send({ embed })
    } catch (error) {
      console.error(`${msg.author.username}: ${msg.content} >> ${error.stack}`)
      return msg.channel.send(`An error occured while getting this bot's uptime.\n\`${error.message}\``)
    }
  }
}

export default Uptime
