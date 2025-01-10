import {Telegraf, Markup} from 'telegraf'
import supabase from './supabase.js'

const token = '7538704808:AAEw3IZpnnwYLjuM2NAb3-YwOWffb5iJ94g'
const webAppUrl = 'https://tfcoin-2de78.web.app'

const bot = new Telegraf(token)

bot.command('start', (ctx) => {
  ctx.reply(
    'Привет! Нажми чтобы начать играть!',
    Markup.inlineKeyboard([
      Markup.button.webApp(
        'Начать',
        `${webAppUrl}?ref=${ctx.payload}`
      ),
    ])
  )
})

setInterval(() => {
  const res = supabase.from('users').update({energy: 10000})
}, 20000)


bot.launch()

