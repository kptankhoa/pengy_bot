import {botName, postfix, systemMessage, telegramToken} from "../const/const";
import {Message} from "../model/Message";
import {ChatMessage, RoleEnum} from "../model/ChatMessage";
import {handleMessage} from "./oa-service";

const TelegramBot = require("node-telegram-bot-api");

const BOT_COMMAND = {
    CHAT: new RegExp('^/q +'),
    CALL: new RegExp('^/a'),
    RESET: new RegExp('^/w'),
}

const MESSAGE_LIMIT = 20;

const getMessages = (messages: ChatMessage[]) => {
    const returnMsgs = [
        {
            role: RoleEnum.SYSTEM,
            content: systemMessage
        },
        ...messages
            .map((message, index) => ({
                ...message,
                content: index === messages.length - 1 ? message.content.concat(' ' + postfix) : message.content
            }))
            .splice(messages.length - MESSAGE_LIMIT)
    ];
    console.log('----input----');
    returnMsgs.map((msg) => console.log(`${msg.name || msg.role}: ${msg.content}`));
    return returnMsgs;
};

export const setUpBot = () => {
    const bot = new TelegramBot(telegramToken, { polling: true });
    const chatHistories: Map<number, Array<ChatMessage>> = new Map()

    // handle on call chatbot
    bot.onText(BOT_COMMAND.CHAT, async (msg: Message) => {
        const chatId = msg.chat.id;
        const chatHistory = chatHistories.get(chatId) || []
        const chatContent = msg.text.substring(2).trim();
        bot.sendChatAction(chatId, 'typing');
        chatHistory.push({
            name: msg.from.username,
            content: chatContent,
            role: RoleEnum.USER
        });
        const replyContent = await handleMessage(getMessages(chatHistory));
        console.log('----output----');
        console.log(`${botName}: ${replyContent}\n\n`);
        bot.sendMessage(chatId, replyContent, { reply_to_message_id: msg.message_id });
        chatHistory.push({
            name: botName,
            content: replyContent,
            role: RoleEnum.ASSISTANT
        });
        chatHistories.set(chatId, chatHistory);
    });

    // handle reset chat context
    bot.onText(BOT_COMMAND.CALL, (msg: any) => {
        const chatId = msg.chat.id;

        bot.sendMessage(chatId, 'Nghe?', { reply_to_message_id: msg.message_id });
    });

    // handle reset chat context
    bot.onText(BOT_COMMAND.RESET, (msg: any) => {
        const chatId = msg.chat.id;

        chatHistories.set(chatId, []);

        bot.sendMessage(chatId, 'Cleared', { reply_to_message_id: msg.message_id });
    });

    console.log('---bot is running---')
};
