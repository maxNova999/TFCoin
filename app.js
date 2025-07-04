import {Telegraf, Markup} from 'telegraf'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://eudmdrhihjjuiwgjfipg.supabase.co'
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZG1kcmhpaGpqdWl3Z2pmaXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNzU2MjAsImV4cCI6MjA2Mzc1MTYyMH0.003sI3sZ4eHySO1kAhRPdmDtomURBB3rvznn7iEN7PU'
const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY)

const token = '7632573230:AAGz6u0RL7tf73uR2F0SKubQBkbqX3sWXkE'
const webAppUrl = 'https://v0-top-frame-mobile-app.vercel.app/'

const bot = new Telegraf(token)

// bot.command('start', (ctx) => {
//   ctx.reply(
//     'Привет! Нажми чтобы начать играть!',
//     Markup.inlineKeyboard([
//       Markup.button.webApp(
//         'Начать',
//         `${webAppUrl}?ref=${ctx.payload}`
//       ),
//     ])
//   )
// })

// bot.launch()



async function addBonus(user_id, friend_telegram_id = null) {
  const refBonus = 5000

  if(user_id !== null) {
    const { data } = await supabase
    .from('users')
    .select('coins')
    .eq('id', user_id)
    .single();

    const newBalance = data.coins + refBonus;

    await supabase.from('users').update({coins: newBalance}).eq('id', user_id) // исправить что счет меняется на 5000
  }
  if(friend_telegram_id !== null) {
    const { data } = await supabase
    .from('users')
    .select('coins')
    .eq('telegram_id', friend_telegram_id)
    .single();

    const newBalance = data.coins + refBonus;
    await supabase.from('users').update({coins: newBalance}).eq('telegram_id', friend_telegram_id)
  }
  // await supabase.rpc('add_to_balance', { user_id, amount: refBonus })

}

async function checkReferral(friend_telegram_id, user_id) {
  const { data: user } = await supabase
  .from('users')
  .select('telegram_id')
  .eq('id', user_id)
  .single();

  const my_telegram_id = user.telegram_id;

  if (my_telegram_id === friend_telegram_id) {
    console.log('Нельзя добавить самого себя в друзья!');
    return false;
  }

  const { data } = await supabase
    .from('friends')
    .select('id') // Можно выбрать любой столбец, нам важен факт наличия записи
    .eq('friend_telegram_id', friend_telegram_id)
    .limit(1)
    .maybeSingle();

  // Если data есть — запись найдена, возвращаем false
  // Если data null — записи нет, возвращаем true

  if (data) return false
  return true
}

bot.start(async (ctx) => {
  // ctx.message.text будет содержать "/start" или "/start some_query"
  const text = ctx.message.text;
  const parts = text.split(' ');

  if (parts.length > 1) {
    const query = parts[1];
    // ctx.reply(`Ты запустил бота с параметром: ${query}`);
    // ctx.reply(await checkReferral(ctx.from.id))
    if(await checkReferral(ctx.from.id, query)) {
      const newFriend = {
        user_id: query, // здесь нужен обычный айди того кто дал ссылку
        friend_telegram_id: ctx.from.id, // тут нужен тг айди того кто получает
        friend_name: ctx.from.first_name, // тут нужно имя того кто получает
        is_referral: true
      }
      const res = await supabase.from('friends').insert(newFriend)
      if(res.status = 201) addBonus(query, ctx.from.id)
      ctx.reply(res.status)
    }
    else ctx.reply('Нельзя добавляться в друзья несколько раз и/или самого себя!')

    ctx.reply(
      'Привет! Нажми чтобы начать играть!',
      Markup.inlineKeyboard([
        Markup.button.webApp(
          'Начать',
          `${webAppUrl}?ref=${ctx.payload}`
        ),
      ])
    )
  }

});

bot.launch();
