import { Message } from 'models';
import { BOT_COMMAND } from 'const/chat';
import { getWeatherLocation, handleWeatherRequest } from 'services';
import { getWeatherDetailPrompt } from 'const/prompts';
import { defaultMessage } from 'const/settings';
import { handleChatMessage } from 'libs/message-handler/handle-text-message';

export const onWeatherMessage = async (bot: any, msg: Message) => {
  const chatId = msg.chat.id;
  const chatText = msg.text.replace(BOT_COMMAND.WEATHER, '');

  const location = await getWeatherLocation(chatText);
  const weatherPrompt = getWeatherDetailPrompt(chatText);

  const sendWeatherMsgCallback = async (weatherObject: any) => {
    if (!weatherObject) {
      return bot.sendMessage(chatId, `${defaultMessage}, ở địa ngục ha j?`, { reply_to_message_id: msg.message_id });
    }
    bot.sendChatAction(chatId, 'typing');
    const newMsg: Message = {
      ...msg,
      text: `${weatherPrompt}\n${JSON.stringify(weatherObject, null, 2)}`.trim()
    };
    handleChatMessage(bot, newMsg, 'pengy');
  };

  handleWeatherRequest(location.substring(0, location.length - 1), sendWeatherMsgCallback);
};