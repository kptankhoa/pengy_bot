import { Note } from 'models';
import moment from 'moment/moment';

export const getWeatherLocationPrompt = (text: string) => `You're an geographist and you help user to find locations mentioned in text and only give the location name. for example, when I ask "hôm nay thời tiết Nha Trang có phù hợp để chạy bộ không?", you will answer "Nha Trang". first, please help me with this text: ${text}. give me the location name only`;

export const getWeatherDetailPrompt = (text: string) => `Given the following JSON, give me a Vietnamese report and forecast of the weather now and following days. "current" is the weather right now. Each field in "daily" is an array aligned by index with daily.time, and index 0 is today. weather_code is a WMO weather code: translate it to plain Vietnamese (e.g. 51-55 drizzle, 61-65 rain, 80-82 showers, 95-99 thunderstorm), never print the number. Temperatures are in °C, wind speed in km/h, precipitation_probability_max is a percentage. Use emojis to report and forecast specifically for each day. And answer following question if have any: ${text}`;

export const getExtraVocabularyPrompt = (obj: any) => `\tThe following JSON will contain some words with theirs meanings to consolidate your vocabulary: ${JSON.stringify(obj)}.`;

export const getTimePrompt = () =>
  `\tThe current timestamp is ${moment(Date.now()).utcOffset("+0700").format("DD/MM/yyyy HH:mm")} in case there are questions about time. Use GMT+7 timezone by default. Reply in plain text only, no Markdown. User messages start with the speaker's name; use it to address people but never start your replies with a name prefix.`;

export const getNotePrompt = (text: string, notes: Note[]) => `Given the following JSON containing a note object with its content and who made it: ${JSON.stringify(notes)}. Using Vietnamese, answer the following request: ${text}`;
