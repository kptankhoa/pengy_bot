import { STICKER_SET, telegramToken } from 'const/settings';
import { Message } from 'models';
import { getMessageHandler } from 'libs/message-handler';
import { BOT_COMMAND, NOTI_GROUP_ID, pepeStickerMap } from 'const/chat';
import { Sticker } from 'models/sticker';
import { checkChatIdExist } from 'libs/firebase';

const TelegramBot = require('node-telegram-bot-api');

export const setUpBot = () => {

  const bot = new TelegramBot(telegramToken, { polling: true });

  const notifyNewChatId = async (msg: Message) => {
    const chatId = msg.chat.id;
    if (!await checkChatIdExist(chatId)) {
      const newMsgNoti = 'Mới có chat mới';
      const json = JSON.stringify(msg, null, 2);
      await bot.sendMessage(NOTI_GROUP_ID, `${newMsgNoti}\n${json}`, {
        entities: [{ offset: newMsgNoti.length + 1, length: json.length, type: 'code' } ]
      });
    }
  };

  const onTextMsg = (msg: Message) => {
    notifyNewChatId(msg);
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

    if (BOT_COMMAND.NOTE.test(chatText)) {
      return messageHandler.onNote(msg);
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

  bot.sendMessage(NOTI_GROUP_ID, 'Mới reset bot');

  console.info('---bot is running---');
};
