import {botName, telegramToken} from "../const/const";
import {Message} from "../model/Message";
import {ChatMessage, RoleEnum} from "../model/ChatMessage";
import {handleMessage} from "./oa-service";

const TelegramBot = require("node-telegram-bot-api");

const BOT_COMMAND = {
    CHAT: new RegExp('^/q +'),
    RESET: new RegExp('^/w'),
}

export const setUpBot = () => {
    const bot = new TelegramBot(telegramToken, { polling: true });
    const chatHistory: Array<ChatMessage> = []

    // handle on call chatbot
    bot.onText(BOT_COMMAND.CHAT, async (msg: Message) => {
        const chatId = msg.chat.id;
        const chatContent = msg.text.substring(2).trim();
        bot.sendChatAction(chatId, 'typing');
        chatHistory.push({
            name: msg.chat.username,
            content: chatContent,
            role: RoleEnum.USER
        });
        const replyContent = await handleMessage(chatHistory);
        console.log({ replyContent })
        chatHistory.push({
            name: botName,
            content: replyContent,
            role: RoleEnum.ASSISTANT
        });
        bot.sendMessage(chatId, replyContent, { reply_to_message_id: msg.message_id });
    });

    // handle reset chat context
    bot.onText(BOT_COMMAND.RESET, (msg: any) => {
        const chatId = msg.chat.id;

        chatHistory.length = 0;

        bot.sendMessage(chatId, 'Cleared', { reply_to_message_id: msg.message_id });
    });
};
