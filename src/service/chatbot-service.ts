import {botName, telegramToken} from "../const/config.const";
import {Message, MessageType} from "../model/Message";
import {ChatMessage, RoleEnum} from "../model/ChatMessage";
import {handleMessage} from "./oa-service";
import {characteristicMap, ChatModeEnum, chatModes} from "../const/characteristics";

const TelegramBot = require("node-telegram-bot-api");

const BOT_COMMAND = {
    RESET: new RegExp('^/z'),
}

const MESSAGE_LIMIT = 20;

const getChatHistoryKey = (mode: ChatModeEnum, chatId: number) => `${mode}-${chatId}`;

const getMessages = (messages: ChatMessage[], mode: ChatModeEnum) => {
    const { systemGuide, postfix } = characteristicMap[mode];
    const returnMsgs = [
        {
            role: RoleEnum.SYSTEM,
            content: systemGuide
        },
        ...messages
            .map((message, index) => ({
                ...message,
                content: (index === messages.length - 1)
                    ? message.content.concat('\n' + postfix).trim()
                    : message.content
            }))
            .splice(messages.length - MESSAGE_LIMIT)
    ];
    console.log('------input------');
    returnMsgs.map((msg) => console.log(`${msg.name || msg.role}: ${msg.content}`));
    return returnMsgs;
};

export const setUpBot = () => {
    const bot = new TelegramBot(telegramToken, { polling: true });
    const chatHistories: Map<string, Array<ChatMessage>> = new Map();

    const handleIncomingMessage = async (msg: Message, mode: ChatModeEnum) => {
        const chatId = msg.chat.id;
        const historyId = getChatHistoryKey(mode, chatId);
        const chatHistory = chatHistories.get(historyId) || []
        const chatContent = msg.text.substring(2).trim();
        const isPrivate = msg.chat.type === MessageType.PRIVATE;
        console.log(`\n\n--------from: ${isPrivate ? msg.chat.username : msg.chat.title}, message_id: ${msg.message_id}, mode: ${mode}`);
        bot.sendChatAction(chatId, 'typing');
        chatHistory.push({
            name: msg.from.username,
            content: chatContent,
            role: RoleEnum.USER
        });
        const replyContent = await handleMessage(getMessages(chatHistory, mode));
        console.log('------output------');
        console.log(`${botName}: ${replyContent}`);
        bot.sendMessage(chatId, replyContent, { reply_to_message_id: msg.message_id });
        chatHistory.push({
            name: botName,
            content: replyContent,
            role: RoleEnum.ASSISTANT
        });
        chatHistories.set(historyId, chatHistory);
    }

    // // handle on call chatbot
    // bot.onText(BOT_COMMAND.CHAT, async (msg: Message) => handleIncomingMessage(msg, false));
    //
    // // handle on dev request
    // bot.onText(BOT_COMMAND.DEV, async (msg: Message) => handleIncomingMessage(msg, true));

    chatModes.forEach((chatMode) => {
        bot.onText(chatMode.command, async (msg: Message) => handleIncomingMessage(msg, chatMode.mode));
    })
    // handle reset chat context
    bot.onText(BOT_COMMAND.RESET, (msg: Message) => {
        const chatModeMap = {
            c: ChatModeEnum.chillax,
            d: ChatModeEnum.dev,
            s: ChatModeEnum.story,
            n: ChatModeEnum.news,
            w: ChatModeEnum.compose,
            x: ChatModeEnum.dieubinh,
        };
        const chatId = msg.chat.id;
        // @ts-ignore
        const toBeResetMode = chatModeMap[msg.text[3]];
        if (!toBeResetMode) {
            bot.sendMessage(chatId, 'Chọn sai rồi, chọn lại đi', { reply_to_message_id: msg.message_id });
            return;
        }
        const historyId = getChatHistoryKey(toBeResetMode, chatId);

        chatHistories.set(historyId, []);
        console.log(`\n\n--------reset: message_id: ${msg.message_id}, mode: ${toBeResetMode}`);
        bot.sendMessage(chatId, 'Cleared', { reply_to_message_id: msg.message_id });
    });

    console.log('---bot is running---')
};
