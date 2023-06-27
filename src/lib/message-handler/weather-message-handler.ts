import { Message } from "../../model/message";
import { BOT_COMMAND } from "../../const/chat/bot-command";
import { getWeatherLocation, handleWeatherRequest } from "../../service/weather-service";
import { defaultMessage } from "../../const/settings/chatbot-config";
import { ChatModeEnum } from "../../const/chat/characteristics";
import { handleChatMessage } from "./chat-message-handler";
import { getWeatherDetailPrompt } from "../../const/prompts";

export const onWeatherMessage = async (bot: any, msg: Message) => {
    const chatId = msg.chat.id;
    const chatText = msg.text.replace(BOT_COMMAND.WEATHER, '');

    const location = await getWeatherLocation(chatText)
    const weatherPrompt = getWeatherDetailPrompt(chatText);

    const sendWeatherMsgCallback = async (weatherObject: any) => {
        if (!weatherObject) {
            return bot.sendMessage(chatId, `${defaultMessage}, ở địa ngục ha j?`, { reply_to_message_id: msg.message_id });
        }
        bot.sendChatAction(chatId, 'typing');
        const newMsg: Message = {
            ...msg,
            text: `${weatherPrompt}\n${JSON.stringify(weatherObject, null, 2)}`.trim()
        }
        handleChatMessage(bot, newMsg, ChatModeEnum.pengy);
    };

    handleWeatherRequest(location.substring(0, location.length - 1), sendWeatherMsgCallback);
}