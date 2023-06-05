import { defaultBotName, defaultMessage, telegramToken } from "../const/chatbot-config.const";
import { Message, MessageType } from "../model/message";
import { ChatMessage, RoleEnum } from "../model/chat-message";
import { handleImageRequest, handleMessageRequest } from "./oa-service";
import { characteristicMap, ChatModeEnum, chatModes, getChatBotRegEx, resetMap } from "../const/characteristics";
import { handleWeatherRequest } from "./weather-service";
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
        const chatContent = msg.text.startsWith('/') ? msg.text.replace(getChatBotRegEx(mode), '').trim() : msg.text;
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

    const handleResetMessage = (msg: Message) => {
        const chatId = msg.chat.id;
        // @ts-ignore
        const toBeResetMode = resetMap[msg.text[3]];
        if (!toBeResetMode) {
            return bot.sendMessage(chatId, 'Chọn sai rồi, chọn lại đi', { reply_to_message_id: msg.message_id });
        }
        const historyId = getChatHistoryKey(toBeResetMode, chatId);
        chatHistories.set(historyId, []);
        console.log(`\n\n--------reset: message_id: ${msg.message_id}, mode: ${toBeResetMode}`);
        bot.sendMessage(chatId, `Cleared chat history in ${toBeResetMode} mode`, { reply_to_message_id: msg.message_id });
    };

    const handleImageMessage = async (msg: Message) => {
        const chatId = msg.chat.id;
        const prompt = msg.text.replace(BOT_COMMAND.IMAGE, '').trim();
        const isPrivate = msg.chat.type === MessageType.PRIVATE;
        bot.sendMessage(chatId, `Đang vẽ chờ xíu`, { reply_to_message_id: msg.message_id });
        bot.sendChatAction(chatId, 'typing');
        console.log(`\n\n--------image request from: ${isPrivate ? msg.chat.username : msg.chat.title}, message_id: ${msg.message_id}, time: ${new Date()}`);
        console.log(`prompt: ${prompt}`)
        const imageUrl = await handleImageRequest(prompt);
        imageUrl
            ? bot.sendPhoto(chatId, imageUrl, { reply_to_message_id: msg.message_id })
            : bot.sendMessage(chatId, `Hư quá. vẽ cái khác đi :v`, { reply_to_message_id: msg.message_id });
    }

    const handleWeatherMessage = async (msg: Message) => {
        const mode = ChatModeEnum.pengy;
        const chatId = msg.chat.id;
        const historyId = getChatHistoryKey(mode, chatId);
        const chatHistory = chatHistories.get(historyId) || [];
        const isPrivate = msg.chat.type === MessageType.PRIVATE;
        const botName = 'weather';
        console.log(`\n\n--------from: ${isPrivate ? msg.chat.username : msg.chat.title}, message_id: ${msg.message_id}, mode: ${mode}, time: ${new Date()}`);
        const [search, q] = msg.text.replace(BOT_COMMAND.WEATHER, '').trim().split(',');
        const weatherPrompt = 'Given the following JSON, give me a Vietnamese report and forecast of the weather now and following days. Note that forecast[0] is the forecast of later today. Use lots of emojis to report and forecast specifically for each day.';
        const questionPrompt = q ? ` And answer the question: ${q}` : '';
        bot.sendChatAction(chatId, 'typing');
        const sendWeatherMsgCallback = async (weatherObject: any) => {
            if (!weatherObject) {
                return bot.sendMessage(chatId, `${defaultMessage}, ở địa ngục ha j?`, { reply_to_message_id: msg.message_id });
            }
            chatHistory.push({
                name: msg.from.username,
                content: `${weatherPrompt}${questionPrompt}`,
                role: RoleEnum.USER
            });
            const history: ChatMessage[] = [{
                name: msg.from.username,
                role: RoleEnum.USER,
                content: `${weatherPrompt}${questionPrompt}\n${JSON.stringify(weatherObject, null, 2)}`
            }];
            const replyContent = await handleMessageRequest(history, mode);
            console.log('------output------');
            console.log(`${botName}: ${replyContent}`);
            const res: Message = bot.sendMessage(chatId, replyContent, { reply_to_message_id: msg.message_id });
            chatHistory.push({
                name: botName,
                content: replyContent,
                role: RoleEnum.ASSISTANT
            });
            botMessageIdMap.set(res.message_id, mode);
            lastInteractionModeMap.set(chatId, mode);
            chatHistories.set(historyId, chatHistory);
        };
        handleWeatherRequest(search, sendWeatherMsgCallback);
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

    bot.on('message', (msg: Message) => {
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
        if (replyToBotMode) {
            return handleIncomingMessage(msg, replyToBotMode);
        }
        const lastInteractionMode = lastInteractionModeMap.get(chatId);
        lastInteractionMode ? handleIncomingMessage(msg, lastInteractionMode) : handleIncomingMessage(msg, ChatModeEnum.pengy);
    });

    console.log('---bot is running---');
};
