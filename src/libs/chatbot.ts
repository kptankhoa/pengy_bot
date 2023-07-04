import { STICKER_SET, telegramToken, telegramTokenDev } from 'const/settings';
import { Message } from 'models';
import { getMessageHandler } from 'libs/message-handler';
import { BOT_COMMAND, pepeStickerMap } from 'const/chat';
import { Sticker } from 'models/sticker';

const TelegramBot = require('node-telegram-bot-api');

export const setUpBot = (mode: 'dev' | 'prod') => {
  const tokenMap = {
    dev: telegramTokenDev,
    prod: telegramToken
  };

  const bot = new TelegramBot(tokenMap[mode], { polling: true });

  const onTextMsg = (msg: Message) => {
    const messageHandler = getMessageHandler(bot);
    const chatText = msg.text;

    if (BOT_COMMAND.RESET.test(chatText)) {
      return messageHandler.onReset(msg);
    }

    if (BOT_COMMAND.IMAGE.test(chatText)) {
      return messageHandler.onImage(msg);
    }

    if (BOT_COMMAND.WEATHER.test(chatText)) {
      return messageHandler.onWeather(msg);
    }

    if (BOT_COMMAND.NEWS.test(chatText)) {
      return messageHandler.onNews(msg);
    }

    if (BOT_COMMAND.DICT.test(chatText)) {
      return messageHandler.onDictionary(msg);
    }

    if (BOT_COMMAND.FUND.test(chatText)) {
      return messageHandler.onFund(msg);
    }

    return messageHandler.onNewMessage(msg);

  };

  bot.on('message', (msg: Message) => {
    if (msg.text) {
      return onTextMsg(msg);
    }
  });

  bot.getStickerSet(STICKER_SET).then((res: any) => {
    if (!res?.stickers?.length) {
      return;
    }
    const stickers = [...res.stickers];
    stickers.reverse();
    stickers.forEach((sticker: Sticker) => pepeStickerMap.set(sticker.emoji, sticker.file_id));
  });

  if (mode === 'prod') {
    bot.sendMessage('-1001963630601', 'Mới reset bot');
  }

  console.info('---bot is running---');
};
