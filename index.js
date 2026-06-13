import dotenv from 'dotenv'
dotenv.config()

import fs from 'fs'

import {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} from 'discord.js'

const APPROVER_ID = '734034051144482816'
const MEDIA_CHANNEL_ID = '1515367639868768360'

// Load data
let data = {
  mediaCount: {},
  countedMessages: []
}

if (fs.existsSync('./mediaCounts.json')) {
  data = JSON.parse(
    fs.readFileSync('./mediaCounts.json', 'utf8')
  )
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
})

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`)
})

//
// SLASH COMMANDS
//
client.on('interactionCreate', async interaction => {

  if (!interaction.isChatInputCommand()) return

  //
  // /ping
  //
  if (interaction.commandName === 'ping') {
    return interaction.reply('hi im birdyuukay')
  }

  //
  // /stats
  //
  if (interaction.commandName === 'stats') {

    const targetUser =
      interaction.options.getUser('user') ||
      interaction.user

    const count =
      data.mediaCount[targetUser.id] || 0

    const sortedUsers = Object.entries(data.mediaCount)
      .sort((a, b) => b[1] - a[1])

    const rank =
      sortedUsers.findIndex(
        ([userId]) => userId === targetUser.id
      ) + 1

    let embedColor = 0x5865F2 // Discord Blurple

    if (rank === 1) {
      embedColor = 0xFFD700 // Gold
    } else if (rank === 2) {
      embedColor = 0xC0C0C0 // Silver
    } else if (rank === 3) {
      embedColor = 0xCD7F32 // Bronze
    }

    const crown =
      rank === 1
        ? '\n👑 meme corner CEO'
        : ''

    const statsEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle('📊 meme corner statistics')
      .setThumbnail(
        targetUser.displayAvatarURL()
      )
      .addFields(
        {
          name: '👤 user',
          value: targetUser.username,
          inline: true
        },
        {
          name: '📸 approved submissions',
          value: String(count),
          inline: true
        },
        {
          name: '🏆 rank',
          value:
            (rank > 0
              ? `#${rank}`
              : 'Unranked') + crown,
          inline: true
        }
      )
      .setFooter({
        text: 'the birdyuukay meme corner tracker™'
      })

    return interaction.reply({
      embeds: [statsEmbed]
    })
  }

  //
  // /leaderboard
  //
  if (interaction.commandName === 'leaderboard') {

    const sortedUsers = Object.entries(data.mediaCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    if (sortedUsers.length === 0) {
      return interaction.reply(
        'theres lowkenuinely 0 approved submissions'
      )
    }

    let leaderboardText = ''

    for (let i = 0; i < sortedUsers.length; i++) {

      const [userId, count] = sortedUsers[i]

      try {

        const user =
          await client.users.fetch(userId)

        const medal =
          i === 0 ? '🥇' :
          i === 1 ? '🥈' :
          i === 2 ? '🥉' :
          '📸'

        leaderboardText +=
          `${medal} **${user.username}** — ${count} approved submissions: your the official meme corner CEO\n`

      } catch {

        leaderboardText +=
          `${i + 1}. Unknown User — ${count} approved submissions: literally wpopoff\n`
      }
    }

    const leaderboardEmbed =
      new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('🏆 meme corner leaderboard')
        .setThumbnail(
          interaction.guild?.iconURL()
        )
        .setDescription(leaderboardText)
        .setFooter({
          text: 'the birdyuukay meme corner tracker™'
        })

    return interaction.reply({
      embeds: [leaderboardEmbed]
    })
  }
})

//
// COUNT MEDIA ONLY WHEN YOU REACT WITH ✅
//
client.on('messageReactionAdd', async (reaction, user) => {

  if (reaction.partial) {
    await reaction.fetch()
  }

  if (reaction.message.partial) {
    await reaction.message.fetch()
  }

  // Must be you
  if (user.id !== APPROVER_ID) return

  // Must be a checkmark
  if (reaction.emoji.name !== '✅') return

  const message = reaction.message

  // Must be in media channel
  if (message.channel.id !== MEDIA_CHANNEL_ID) return

  // Prevent double counting
  if (data.countedMessages.includes(message.id)) return

  const hasAttachment =
    message.attachments.size > 0

  const hasMediaEmbed =
    message.embeds.some(embed =>
      embed.image ||
      embed.thumbnail ||
      embed.video
    )

  const hasImageLink =
    /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|mp4|mov))/i
      .test(message.content)

  if (
    !hasAttachment &&
    !hasMediaEmbed &&
    !hasImageLink
  ) {
    return
  }

  const uploaderId = message.author.id

  if (!data.mediaCount[uploaderId]) {
    data.mediaCount[uploaderId] = 0
  }

  data.mediaCount[uploaderId]++

  data.countedMessages.push(message.id)

  fs.writeFileSync(
    './mediaCounts.json',
    JSON.stringify(data, null, 2)
  )

  console.log(
    `${message.author.username} now has ${data.mediaCount[uploaderId]} approved submissions`
  )
})

client.login(process.env.DISCORD_TOKEN)