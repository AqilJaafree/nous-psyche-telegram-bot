var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { Telegraf, Markup } = require('telegraf');
const { ethers } = require('ethers');
const { getBotState, setBotState } = require('./storage');
const { processQuery, getHolderFromContract } = require('./logic');

require('dotenv').config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use((ctx, next) => {
  if (
    ctx.message &&
    ctx.message.entities &&
    ctx.message.entities.some((entity) => entity.type === 'mention')
  ) {
    const chatId = ctx.chat.id;
    getBotState(chatId, (err, row) => {
      if (err) {
        return ctx.reply('An error occurred.');
      }

      if (!row || (row && row.isActive === 0)) {
        return ctx.reply('Bot is currently deactivated in this group!');
      }

      return next();
    });
  } else {
    return next();
  }
});

bot.mention(process.env.BOT_NAME, (ctx) => {
  processQuery(ctx);
});

/**
 * To register this bot, user need to submit
 * token id, and api key
 */
bot.command('register', async (ctx) => {
  // Check if the bot active
  const chatId = ctx.chat.id;
  getBotState(chatId, (err, row) => {
    if (err) {
      return ctx.reply('An error occurred.');
    }

    if (row && row.isActive === 1) {
      return ctx.reply('Bot is already active');
    }
  });

  if (!ctx.payload) {
    bot.telegram.sendMessage(ctx.chat.id, 'No payload during register', {});
    return;
  }

  const data = ctx.payload.split('/');

  if (data.length != 2) {
    bot.telegram.sendMessage(
      ctx.chat.id,
      'Invalid payload format. Please follow `/register <SIGNATURE>/<TOKEN_ID>',
      {}
    );
    return;
  }

  try {
    const signerAddress = ethers.verifyMessage('Hi', data[0]);
    const chatId = ctx.chat.id;
    const owner = await getHolderFromContract(data[1]);

    if (signerAddress.toLowerCase() === owner.toLowerCase()) {
      setBotState(chatId, 1, (err) => {
        if (err) {
          return ctx.reply('An error occurred.');
        }
        bot.telegram.sendMessage(
          ctx.chat.id,
          `Successfully activated NOUS for this group.`,
          {}
        );
      });
    } else {
      bot.telegram.sendMessage(
        ctx.chat.id,
        `NOUS activation failed for this group.`,
        {}
      );
    }
  } catch (e) {
    console.log(e);
    bot.telegram.sendMessage(ctx.chat.id, 'Invalid token in the payload', {});
    return;
  }
});

bot.command('unregister', async (ctx) => {
  try {
    const admins = await bot.telegram.getChatAdministrators(ctx.chat.id);
    const userId = ctx.from.id;

    const isAdmin = admins.some((admin) => admin.user.id === userId);

    if (isAdmin) {
      const chatId = ctx.chat.id;
      setBotState(chatId, 0, (err) => {
        if (err) {
          return ctx.reply(
            'An error occurred while deactivating the bot for this group.'
          );
        }
        ctx.reply('Successfully deactivated NOUS for this group.');
      });
    } else {
      ctx.reply('Only an admin can unregister the bot.');
    }
  } catch (err) {
    console.error('Error fetching chat admins:', err);
    ctx.reply('An error occurred. Please try again.');
  }
});

bot.telegram.setMyCommands([
  { command: '/register', description: 'Register the bot' },
  { command: '/unregister', description: 'Unregister the bot' },
]);

bot.launch();

module.exports = app;
