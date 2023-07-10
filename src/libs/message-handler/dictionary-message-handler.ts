import { commandMapping, dictUsage } from 'const/firebase';
import { Dictionary, DictWord, Message } from 'models';
import { createWord, findWord, getDictionary, removeWord } from 'services';
import { BOT_COMMAND } from 'const/chat';
import { printWords } from 'utils';

const getDefaultMessage = () => 'No command recognized, use `/dict help` to show available commands.';

const getHelp = () => {
  const description = 'Pengy dictionary: fuck your language';
  const usageLine = 'USAGE: `/dict [command] [options?]`';
  const commandListLine = 'Command list:';
  const usage = Object.entries(dictUsage)
    .filter(([, usage]) => !!usage)
    .map(([key, usage]) => `${key}${usage?.params ? `\t${usage.params}` : ''}:\t${usage?.purpose}`)
    .join('\n');

  return `${description}\n${usageLine}\n${commandListLine}\n${usage}`;
};

const getWords = async (chatId: number) => {
  const dictionary: Dictionary = await getDictionary(chatId);
  const words: DictWord[] = Array
    .from(dictionary.values())
    .sort((a, b) => a.word.localeCompare(b.word));
  if (!words.length) {
    return 'Chưa có từ nào trong từ điển của bạn';
  }
  return printWords(words);
};

const getWord = async (chatId: number, text: string) => {
  const search = text.replace(commandMapping.get, '').trim();
  const words: DictWord[] | null = await findWord(chatId, search);

  if (!words) {
    return `Không tìm kết quả cho ${search}.`;
  }

  return `Kết quả tìm kiếm cho ${search}:\n${printWords(words)}`;
};

const deleteWord = async (chatId: number, text: string) => {
  const search = text.replace(commandMapping.delete, '').trim();

  await removeWord(chatId, search);

  return `Đã xóa từ ${search}`;
};

const addWord = async (chatId: number, text: string, regex: RegExp) => {
  const newWordStr = text.replace(regex, '').trim();
  const [word, type, meaning, synonym] = newWordStr.split(':');

  const newWord: DictWord = {
    word: word?.trim() || '',
    type: type?.trim() || '',
    meaning: meaning?.trim() || '',
    synonym: synonym ? [...synonym.split(',').map((s => s.trim()))] : undefined
  } as DictWord;

  if (!synonym?.length) {
    delete newWord.synonym;
  }

  await createWord(chatId, newWord);

  return `Đã thêm từ mới: ${word}`;
};

const getReplyMessage = async (chatId: number, text: string): Promise<string> => {
  if (!text || commandMapping.all.test(text)) {
    return getWords(chatId);
  }

  if (commandMapping.help.test(text)) {
    return getHelp();
  }

  if (commandMapping.get.test(text)) {
    return getWord(chatId, text);
  }

  if (commandMapping.set.test(text)) {
    return addWord(chatId, text, commandMapping.set);
  }

  if (commandMapping.update.test(text)) {
    return addWord(chatId, text, commandMapping.update);
  }

  if (commandMapping.delete.test(text)) {
    return deleteWord(chatId, text);
  }

  return getDefaultMessage();
};

export const onDictionaryMessage = async (bot: any, msg: Message) => {
  const chatId = msg.chat.id;
  const chatText = msg.text.replace(BOT_COMMAND.DICT, '').trim();

  const replyMessage = await getReplyMessage(chatId, chatText);
  await bot.sendMessage(chatId, replyMessage, { reply_to_message_id: msg.message_id });
};
