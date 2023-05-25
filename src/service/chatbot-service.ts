import {defaultBotName, telegramToken} from "../const/config.const";
import {Message, MessageType} from "../model/Message";
import {ChatMessage, RoleEnum} from "../model/ChatMessage";
import {handleMessages} from "./oa-service";
import {characteristicMap, ChatModeEnum, chatModes} from "../const/characteristics";

const TelegramBot = require("node-telegram-bot-api");

const BOT_COMMAND = {
    RESET: new RegExp('^/z'),
}

const getChatHistoryKey = (mode: ChatModeEnum, chatId: number) => `${mode}-${chatId}`;

export const setUpBot = () => {
    const bot = new TelegramBot(telegramToken, { polling: true });
    const chatHistories: Map<string, Array<ChatMessage>> = new Map();
    const lastInteraction: Map<number, ChatModeEnum> = new Map();

    const handleIncomingMessage = async (msg: Message, mode: ChatModeEnum) => {
        const chatId = msg.chat.id;
        const historyId = getChatHistoryKey(mode, chatId);
        const chatHistory = chatHistories.get(historyId) || []
        const chatContent = msg.text.startsWith('/') ? msg.text.substring(2).trim() : msg.text;
        const isPrivate = msg.chat.type === MessageType.PRIVATE;
        const botName = characteristicMap[mode]?.name || defaultBotName;
        console.log(`\n\n--------from: ${isPrivate ? msg.chat.username : msg.chat.title}, message_id: ${msg.message_id}, mode: ${mode}, time: ${new Date()}`);
        bot.sendChatAction(chatId, 'typing');
        chatHistory.push({
            name: msg.from.username,
            content: chatContent,
            role: RoleEnum.USER
        });
        const replyContent = await handleMessages(chatHistory, mode);
        console.log('------output------');
        console.log(`${botName}: ${replyContent}`);
        bot.sendMessage(chatId, replyContent, { reply_to_message_id: msg.message_id });
        chatHistory.push({
            name: botName,
            content: replyContent,
            role: RoleEnum.ASSISTANT
        });
        lastInteraction.set(chatId, mode);
        chatHistories.set(historyId, chatHistory);
    };

    const handleResetMessage = (msg: Message) => {
        const chatModeMap = {
            c: ChatModeEnum.chillax,
            d: ChatModeEnum.dev,
            s: ChatModeEnum.story,
            n: ChatModeEnum.news,
            w: ChatModeEnum.compose,
            t: ChatModeEnum.translator,
            g: ChatModeEnum.google,
            k: ChatModeEnum.karen,
            x: ChatModeEnum.steven,
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
        bot.sendMessage(chatId, `Cleared chat history in ${toBeResetMode} mode`, { reply_to_message_id: msg.message_id });
    }

    bot.on('message', (msg: Message) => {
        const chatText = msg.text;
        const chatId = msg.chat.id;

        if (chatText.match(BOT_COMMAND.RESET)) {
            handleResetMessage(msg);
            return;
        }

        const chatMode = chatModes.find((mode) => chatText.match(mode.command));
        if (chatMode) {
            handleIncomingMessage(msg, chatMode.mode);
            return;
        }

        const lastInteractionMode = lastInteraction.get(chatId);
        lastInteractionMode ? handleIncomingMessage(msg, lastInteractionMode) : handleIncomingMessage(msg, ChatModeEnum.chillax);
    });

    console.log('---bot is running---');
};
