import {Telegraf, Markup} from 'telegraf'
import { createClient } from '@supabase/supabase-js'
// import { logUserAction } from './logger.js';

const SUPABASE_URL = 'https://eudmdrhihjjuiwgjfipg.supabase.co'
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZG1kcmhpaGpqdWl3Z2pmaXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNzU2MjAsImV4cCI6MjA2Mzc1MTYyMH0.003sI3sZ4eHySO1kAhRPdmDtomURBB3rvznn7iEN7PU'
const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY)

const token = '7632573230:AAGz6u0RL7tf73uR2F0SKubQBkbqX3sWXkE'
const webAppUrl = 'https://v0-top-frame-mobile-app.vercel.app/'

const bot = new Telegraf(token)

async function addBonus(user_id, friend_telegram_id = null) {
  const refBonus = 5000;

  // Начисление бонуса рефереру
  if (user_id !== null) {
    const { data: coins, error } = await supabase
      .from('users')
      .select('coins, telegram_id, first_name, last_name, username')
      .eq('id', user_id)
      .maybeSingle();

    if (error) {
      console.error("Ошибка при получении баланса пользователя:", error);
      return;
    }

    const newBalance = (coins && coins.coins !== null ? coins.coins : 0) + refBonus;

    const { error: updateError } = await supabase
      .from('users')
      .upsert(
        {
          id: user_id,
          telegram_id: coins?.telegram_id || null,
          first_name: coins?.first_name || "Неизвестно",
          last_name: coins?.last_name || "Неизвестно",
          username: coins?.username || "Неизвестно",
          coins: newBalance,
        },
        { onConflict: 'id' }
      );

    if (updateError) {
      console.error("Ошибка при обновлении баланса пользователя:", updateError);
    } else {
      // console.log(`Бонус ${refBonus} успешно начислен пользователю с ID ${user_id}`);
    }
  }

  // Начисление бонуса приглашенному другу
  if (friend_telegram_id !== null) {
    const { data: coins, error } = await supabase
      .from('users')
      .select('coins, telegram_id, first_name, last_name, username')
      .eq('telegram_id', friend_telegram_id)
      .maybeSingle();

    if (error) {
      console.error("Ошибка при получении баланса друга:", error);
      return;
    }

    const newBalance = (coins && coins.coins !== null ? coins.coins : 0) + refBonus;

    const { error: updateError } = await supabase
      .from('users')
      .upsert(
        {
          telegram_id: friend_telegram_id,
          first_name: coins?.first_name || "Неизвестно",
          last_name: coins?.last_name || "Неизвестно",
          username: coins?.username || "Неизвестно",
          coins: newBalance,
        },
        { onConflict: 'telegram_id' }
      );

    if (updateError) {
      console.error("Ошибка при обновлении баланса друга:", updateError);
    } else {
      // console.log(`Бонус ${refBonus} успешно начислен другу с Telegram ID ${friend_telegram_id}`);
    }
  }
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
  const text = ctx.message.text;
  const parts = text.split(' ');

  try {
    await ctx.reply(
      'Привет! Нажми чтобы начать играть!',
      Markup.inlineKeyboard([
        Markup.button.webApp(
          'Начать',
          `${webAppUrl}?ref=${ctx.payload}`
        ),
      ])
    );
  } catch (error) {
    if (error.response && error.response.error_code === 403) {
      console.log(`Пользователь с ID ${ctx.from.id} заблокировал бота.`);
    } else {
      console.error(`Ошибка при отправке сообщения пользователю с ID ${ctx.from.id}:`, error);
    }
  }

  // // Логируем нового пользователя
  // const newUser = {
  //   telegram_id: ctx.from.id,
  //   first_name: ctx.from.first_name,
  //   last_name: ctx.from.last_name || 'N/A',
  //   username: ctx.from.username || 'N/A',
  // };
  // logUserAction('Новый пользователь', newUser);

  if (parts.length > 1) {
    const query = parts[1];

    if (await checkReferral(ctx.from.id, query)) {
      const newFriend = {
        user_id: query, // ID реферера (того, кто дал ссылку)
        friend_telegram_id: ctx.from.id, // Telegram ID приглашенного
        friend_name: ctx.from.first_name, // Имя приглашенного
        is_referral: true,
      };

      const res = await supabase.from('friends').insert(newFriend);

      if (res.status === 201) {
        // // Логируем добавление в друзья
        // const referrer = {
        //   user_id: query,
        //   telegram_id: ctx.from.id,
        //   username: ctx.from.username || 'N/A',
        // };
        // logUserAction('Добавлен в друзья', newUser, referrer);

        // Начисляем бонусы
        await addBonus(query, ctx.from.id);
      }
    }
  }
});

bot.launch();
