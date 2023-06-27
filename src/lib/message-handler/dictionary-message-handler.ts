import { Message } from "../../model/message";
import { BOT_COMMAND } from "../../const/chat/bot-command";
import { findWord, getDictionary } from "../../service/firebase-service";
import { dictCommandMapping, dictUsage } from "../../const/firebase/dict-command";
import { DictWord } from "../../model/dict-word";
import { ChatModeEnum } from "../../const/chat/characteristics";
import { ChatMessage, RoleEnum } from "../../model/chat-message";
import { getWordUsagePrompt } from "../../const/prompts";
import { handleMessageRequest } from "../../service/oa-service";

const getDefaultMessage = () => "No command recognized, use -help to show available commands.";

const getHelp = () => {
    const description = 'Pengy dictionary: fuck your language';
    const usageLine = 'USAGE: /dict [command] [options?]';
    const commandListLine = 'Command list:';
    const usage = Object.entries(dictUsage)
        .map(([key, usage]) => `${key}${usage.params ? `\t${usage.params}`: ''}:\t\t${usage.usage}`)
        .join('\n');
    return `${description}\n${usageLine}\n${commandListLine}\n${usage}`;
};

const getWords = async () => {
    const wordList: DictWord[] = await getDictionary();

    const getSynonyms = (synonym: DictWord['synonym']) =>  synonym?.length ? `\tTừ đồng nghĩa: ${synonym.join(', ')}.` : '';
    return wordList.map(({ word, type, meaning, synonym}, index) => `${index + 1}. ${word} (${type}): ${meaning}.${getSynonyms(synonym)}`).join('\n');
}

const getWord = async (text: string) => {
    const search = text.replace(dictCommandMapping.find, '').trim();
    const word: DictWord | null = await findWord(search);

    if (!word) {
        return "Ngôn ngữ của bạn không có từ này rui."
    }
    const chatHistory: ChatMessage[] = [
        {
            content: getWordUsagePrompt(word),
            role: RoleEnum.USER
        }
    ];
    return await handleMessageRequest(chatHistory, ChatModeEnum.empty);
}

const getReplyMessage = async (text: string): Promise<string> => {
    console.log(text);
    if (!text || dictCommandMapping.all.test(text)) {
        return await getWords();
    }
    if (dictCommandMapping.help.test(text)) {
        return getHelp();
    }
    if (dictCommandMapping.find.test(text)) {
        return getWord(text);
    }
    return getDefaultMessage();
}

export const onDictionaryMessage = async (bot: any, msg: Message) => {
    const chatId = msg.chat.id;
    const chatText = msg.text.replace(BOT_COMMAND.DICT, '').trim();

    const replyMessage = await getReplyMessage(chatText);
    await bot.sendMessage(chatId, replyMessage, { reply_to_message_id: msg.message_id });
}