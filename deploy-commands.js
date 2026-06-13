import dotenv from 'dotenv'
dotenv.config()

import { REST, Routes, SlashCommandBuilder } from 'discord.js'

const commands = [

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if the bot is online'),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the media leaderboard'),

  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show media statistics')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to check')
        .setRequired(false)
    )

].map(command => command.toJSON())

const rest = new REST({ version: '10' })
  .setToken(process.env.DISCORD_TOKEN)

try {

  console.log('Registering slash commands...')

  await rest.put(
    Routes.applicationGuildCommands(
      '1515372408507207851',
      '1075282469437313025'
    ),
    { body: commands }
  )

  console.log('Slash commands registered!')

} catch (error) {

  console.error(error)

}