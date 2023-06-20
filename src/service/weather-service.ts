import { SimplifiedWeather, Weather } from "../model/weather";
import { simplifyWeatherObject } from "../utils/weather-util";
import { ChatMessage, RoleEnum } from "../model/chat-message";
import { handleMessageRequest } from "./oa-service";
import { ChatModeEnum } from "../const/characteristics";

const weather = require('weather-js');

const getWeatherLocationPrompt = (text: string) => `You're an geographist and you help user to find locations mentioned in text and only give the location name. for example, when I ask "hôm nay thời tiết Nha Trang có phù hợp để chạy bộ không?", you will answer "Nha Trang". first, please help me with this text: ${text}. give me the location name only`
export const getWeatherDetailPrompt = (text: string) => `Given the following JSON, give me a Vietnamese report and forecast of the weather now and following days. Note that forecast[0] is the forecast of later today. Use lots of emojis to report and forecast specifically for each day. And answer following question if have any: ${text}`;

export const getWeatherLocation = async (msg: string)=> {
    const chatHistory: ChatMessage[] = [
        {
            content: getWeatherLocationPrompt(msg),
            role: RoleEnum.USER
        }
    ];
    return await handleMessageRequest(chatHistory, ChatModeEnum.empty);
}

export const getWeatherRequest = (search: string, callback: (weatherObj: SimplifiedWeather | null) => void) => {
    console.log(`-----weather: search: ${search}`);
    weather.find({ search, degreeType: 'C' }, (err: any, result: Weather[]) => {
        if (err || !result.length) {
            console.log('------weather error-----')
            console.log({ err, result });
            callback(null);
            return;
        }
        callback(simplifyWeatherObject(result[0]));
    });
};

export const handleWeatherRequest = (search: string, callback: (weatherObject: any) => void) => {
    getWeatherRequest(search, callback);
}