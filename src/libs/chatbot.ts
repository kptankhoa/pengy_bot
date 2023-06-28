import { telegramToken } from 'const/settings';
import { Message } from 'models';
import { getMessageHandler } from 'libs/message-handler';
import { BOT_COMMAND } from 'const/chat';

const TelegramBot = require('node-telegram-bot-api');

export const setUpBot = () => {
  const bot = new TelegramBot(telegramToken, { polling: true });

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

    return messageHandler.onNewMessage(msg);

  };

  bot.on('message', (msg: Message) => {
    if (msg.text) {
      return onTextMsg(msg);
    }
  });

  console.info('---bot is running---');
};
