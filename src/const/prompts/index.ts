import { DictWord } from 'models/dict-word';
import { Note } from "models";

export const getWeatherLocationPrompt = (text: string) => `You're an geographist and you help user to find locations mentioned in text and only give the location name. for example, when I ask "hôm nay thời tiết Nha Trang có phù hợp để chạy bộ không?", you will answer "Nha Trang". first, please help me with this text: ${text}. give me the location name only`;

export const getWeatherDetailPrompt = (text: string) => `Given the following JSON, give me a Vietnamese report and forecast of the weather now and following days. Note that forecast[0] is the forecast of later today. Use lots of emojis to report and forecast specifically for each day. And answer following question if have any: ${text}`;

export const getWordUsagePrompt = (word: DictWord) => `Given the following JSON containing a word with its type, meaning and synonym: ${JSON.stringify(word)}. Using Vietnamese, introduce the word and give me an example of how to use it`;

export const getExtraVocabularyPrompt = (obj: any) => `The following JSON will contain some words with theirs meanings to consolidate your vocabulary: ${JSON.stringify(obj)}.`;

export const getTimePrompt = () => `The current timestamp is ${new Date().toISOString()} in case there are questions about time. Use GMT+7 timezone by default.`;

export const getNotePrompt = (text: string, notes: Note[]) => `Given the following JSON containing a note object with its content and who made it: ${JSON.stringify(notes)}. Using Vietnamese, answer the following request: ${text}`;
