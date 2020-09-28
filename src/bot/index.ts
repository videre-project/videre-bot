import { Client } from 'discord.js'
import { readdir } from 'fs'
import { sep } from 'path'
import { ICommand } from '../types'

export class Bot extends Client {
  public commands: ICommand[]

  constructor(options?: object) {
    super(options)
    this.commands = []
  }

  loadCommands(dir: string): void {
    readdir(`${dir}${sep}commands`, (err, files) => {
      if (err) return console.log(err)

      files.forEach(f => {
        delete require.cache[require.resolve(`${dir}${sep}commands${sep}${f}`)]
        const cmd = require(`${dir}${sep}commands${sep}${f}`).default
        const cmdName = f.split('.').shift()
        this.commands.push(new cmd())
        console.log(`Loading Command: ${cmdName}`)
      })
    })
  }

  loadEvents(dir: string): void {
    readdir(`${dir}${sep}events`, (err, files) => {
      if (err) return console.log(err)

      files.forEach(f => {
        const event = require(`${dir}${sep}events${sep}${f}`)
        const eventName: any = f.split('.').shift()
        console.log(`Loading Event: ${eventName}`)
        this.on(eventName, (...args) => event.run(this, ...args))
      })
    })
  }
}
