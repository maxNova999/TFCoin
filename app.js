import {Telegraf, Markup} from 'telegraf'

const token = '7632573230:AAGz6u0RL7tf73uR2F0SKubQBkbqX3sWXkE'
const webAppUrl = 'https://v0-top-frame-mobile-app.vercel.app/'

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

bot.launch()

