import { Message } from 'model/message';
import { BOT_COMMAND } from 'const/chat/bot-command';
import { createWord, findWord, getDictionary, removeWord } from 'service/dictionary-service';
import { dictCommandMapping, dictUsage } from 'const/firebase/dict-command';
import { DictWord } from 'model/dict-word';
import { printWords } from 'util/dict-util';

const getDefaultMessage = () => 'No command recognized, use -help to show available commands.';

const getHelp = () => {
  const description = 'Pengy dictionary: fuck your language';
  const usageLine = 'USAGE: /dict [command] [options?]';
  const commandListLine = 'Command list:';
  const usage = Object.entries(dictUsage)
    .map(([key, usage]) => `${key}${usage.params ? `\t${usage.params}`: ''}:\t${usage.purpose}`)
    .join('\n');

  return `${description}\n${usageLine}\n${commandListLine}\n${usage}`;
};

const getWords = () => {
  const wordList: DictWord[] = getDictionary();

  return printWords(wordList);
};

const getWord = (text: string) => {
  const search = text.replace(dictCommandMapping.find, '').trim();
  const words: DictWord[] | null = findWord(search);

  if (!words) {
    return `Không tìm kết quả cho ${search}.`;
  }

  return `Kết quả tìm kiếm cho ${search}:\n${printWords(words)}`;
};

const deleteWord = async (text: string)=> {
  const search = text.replace(dictCommandMapping.delete, '').trim();

  await removeWord(search);

  return `Đã xóa từ ${search}`;
};

const addWord = async (text: string) => {
  const newWordStr = text.replace(dictCommandMapping.add, '').trim();
  const [word, type, meaning, synonym] = newWordStr.split(':');

  const newWord: DictWord = {
    word: word.trim(),
    type: type.trim(),
    meaning: meaning.trim(),
    synonym: synonym ? [...synonym.split(',').map((s => s.trim()))] : undefined
  } as DictWord;

  if (!synonym?.length) {
    delete newWord.synonym;
  }

  await createWord(newWord);

  return `Đã thêm từ mới: ${word}`;
};

const getReplyMessage = async (text: string): Promise<string> => {
  if (!text || dictCommandMapping.all.test(text)) {
    return getWords();
  }

  if (dictCommandMapping.help.test(text)) {
    return getHelp();
  }

  if (dictCommandMapping.find.test(text)) {
    return getWord(text);
  }

  if (dictCommandMapping.add.test(text)) {
    return addWord(text);
  }

  if (dictCommandMapping.delete.test(text)) {
    return deleteWord(text);
  }

  return getDefaultMessage();
};

export const onDictionaryMessage = async (bot: any, msg: Message) => {
  const chatId = msg.chat.id;
  const chatText = msg.text.replace(BOT_COMMAND.DICT, '').trim();

  const replyMessage = await getReplyMessage(chatText);
  await bot.sendMessage(chatId, replyMessage, { reply_to_message_id: msg.message_id });
};