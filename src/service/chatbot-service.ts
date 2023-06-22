import { defaultBotName, defaultMessage, telegramToken } from "../const/chatbot-config.const";
import { characteristicMap, ChatModeEnum, chatModes, getChatBotRegEx, resetMap } from "../const/characteristics";
import { Message, MessageType } from "../model/message";
import { ChatMessage, RoleEnum } from "../model/chat-message";
import { handleMessageRequest } from "./oa-service";
import { handleImageRequest } from "./imggen-service";
import { getWeatherDetailPrompt, getWeatherLocation, handleWeatherRequest } from "./weather-service";
import { getUrlContent } from "./news-service";
import { isUrl } from "../utils/common-util";

const TelegramBot = require("node-telegram-bot-api");

const BOT_COMMAND = {
    RESET: new RegExp('^/z'),
    IMAGE: new RegExp('^/i +'),
    WEATHER: new RegExp('^/b +'),
    NEWS: new RegExp('^/n +'),
}

const getChatHistoryKey = (mode: ChatModeEnum, chatId: number) => `${mode}-${chatId}`;

export const setUpBot = () => {
    const bot = new TelegramBot(telegramToken, { polling: true });
    const chatHistories: Map<string, Array<ChatMessage>> = new Map();
    const botMessageIdMap: Map<number, ChatModeEnum> = new Map();
    const lastInteractionModeMap: Map<number, ChatModeEnum> = new Map();

    const handleIncomingMessage = async (msg: Message, mode: ChatModeEnum) => {
        const chatId = msg.chat.id;
        const historyId = getChatHistoryKey(mode, chatId);
        const chatHistory = chatHistories.get(historyId) || [];
        const chatContent = msg.text?.startsWith('/') ? msg.text.replace(getChatBotRegEx(mode), '').trim() : msg.text;
        const isPrivate = msg.chat.type === MessageType.PRIVATE;
        const botName = characteristicMap[mode]?.name || defaultBotName;
        console.log(`\n\n--------from: ${isPrivate ? msg.chat.username : msg.chat.title}, message_id: ${msg.message_id}, mode: ${mode}, time: ${new Date()}`);
        bot.sendChatAction(chatId, 'typing');
        chatHistory.push({
            name: msg.from.username,
            content: chatContent,
            role: RoleEnum.USER
        });
        const replyContent = await handleMessageRequest(chatHistory, mode);
        console.log('------output------');
        console.log(`${botName}: ${replyContent}`);
        const res: Message = await bot.sendMessage(chatId, replyContent, { reply_to_message_id: msg.message_id });
        chatHistory.push({
            name: botName,
            content: replyContent,
            role: RoleEnum.ASSISTANT
        });
        botMessageIdMap.set(res.message_id, mode);
        lastInteractionModeMap.set(chatId, mode);
        chatHistories.set(historyId, chatHistory);
    };

    const handleResetMessage = async (msg: Message) => {
        const chatId = msg.chat.id;
        const text = msg.text.replace(BOT_COMMAND.RESET, '').trim();
        const modes = text.split(' ');
        const exist: string[] = [];
        const notExist: string[] = [];
        modes.forEach((modeKey) => {
            const toBeResetMode = resetMap[modeKey];
            if (!toBeResetMode) {
                notExist.push(modeKey);
                return;
            }
            const historyId = getChatHistoryKey(toBeResetMode, chatId);
            chatHistories.set(historyId, []);
            exist.push(toBeResetMode);
        });
        const resetModes = exist.join(', ');
        console.info(`\n\n--------reset: message_id: ${msg.message_id}, mode: ${resetModes}`);
        const res: Message = await bot.sendMessage(chatId, `Cleared chat history in: ${resetModes}\nNot available: ${notExist.join(', ')}`, { reply_to_message_id: msg.message_id });
        botMessageIdMap.set(res.message_id, ChatModeEnum.no_reply);
        lastInteractionModeMap.set(chatId, ChatModeEnum.no_reply);
    };

    const handleImageMessage = async (msg: Message) => {
        const chatId = msg.chat.id;
        const prompt = msg.text.replace(BOT_COMMAND.IMAGE, '').trim();
        const isPrivate = msg.chat.type === MessageType.PRIVATE;
        const res: Message = await bot.sendMessage(chatId, `Đang vẽ chờ xíu`, { reply_to_message_id: msg.message_id });
        botMessageIdMap.set(res.message_id, ChatModeEnum.no_reply);
        lastInteractionModeMap.set(chatId, ChatModeEnum.no_reply);
        bot.sendChatAction(chatId, 'typing');
        console.log(`\n\n--------image request from: ${isPrivate ? msg.chat.username : msg.chat.title}, message_id: ${msg.message_id}, time: ${new Date()}`);
        console.log(`prompt: ${prompt}`)
        const imageUrls = await handleImageRequest(prompt);
        if (!imageUrls || !imageUrls.length) {
            return bot.sendMessage(chatId, `Hư quá. vẽ cái khác đi :v`, { reply_to_message_id: msg.message_id });
        }
        const medias = imageUrls.map((url) => ({
            type: 'photo',
            media: url
        }))
        const res1: Message = await bot.sendMediaGroup(chatId, medias, { reply_to_message_id: msg.message_id });
        botMessageIdMap.set(res1.message_id, ChatModeEnum.no_reply);
        lastInteractionModeMap.set(chatId, ChatModeEnum.no_reply);
    }

    const handleWeatherMessage = async (msg: Message) => {
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
            handleIncomingMessage(newMsg, ChatModeEnum.pengy);
        };
        handleWeatherRequest(location.substring(0, location.length - 1), sendWeatherMsgCallback);
    }

    const handleNewsMessage = async (msg: Message) => {
        const chatContent = msg.text.replace(BOT_COMMAND.NEWS, '').trim();
        const mode = ChatModeEnum.news;
        if (!isUrl(chatContent)) {
            return handleIncomingMessage(msg, mode);
        }
        const articleContent = await getUrlContent(chatContent);
        if (!articleContent) {
            return bot.sendMessage(msg.chat.id, 'không đọc báo dc r hehe', { reply_to_message_id: msg.message_id });
        }
        const newMsg: Message = { ...msg, text: articleContent.trim() };
        handleIncomingMessage(newMsg, mode);
    }

    const onTextMsg = (msg: Message) => {
        const chatText = msg.text;
        const replyMessageId = msg.reply_to_message?.message_id;
        const chatId = msg.chat.id;

        if (BOT_COMMAND.RESET.test(chatText)) {
            return handleResetMessage(msg);
        }

        if (BOT_COMMAND.IMAGE.test(chatText)) {
            return handleImageMessage(msg);
        }

        if (BOT_COMMAND.WEATHER.test(chatText)) {
            return handleWeatherMessage(msg);
        }

        if (BOT_COMMAND.NEWS.test(chatText)) {
            return handleNewsMessage(msg);
        }

        const chatMode = chatModes.find((mode) => mode.command.test(chatText));
        if (chatMode) {
            return handleIncomingMessage(msg, chatMode.mode);
        }

        const replyToBotMode = replyMessageId ? botMessageIdMap.get(replyMessageId) : null;
        if (replyToBotMode && replyToBotMode !== ChatModeEnum.no_reply) {
            return handleIncomingMessage(msg, replyToBotMode);
        }
        const lastInteractionMode = lastInteractionModeMap.get(chatId);
        if (lastInteractionMode === ChatModeEnum.no_reply) {
            return;
        }
        lastInteractionMode ? handleIncomingMessage(msg, lastInteractionMode) : handleIncomingMessage(msg, ChatModeEnum.pengy);
    }

    bot.on('message', (msg: Message) => {
        if (msg.text) {
            return onTextMsg(msg);
        }
    });

    console.info('---bot is running---');
};
