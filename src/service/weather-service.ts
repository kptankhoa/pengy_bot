import { SimplifiedWeather, Weather } from "../model/weather";
import { simplifyWeatherObject } from "../utils/weather-util";
import { ChatMessage, RoleEnum } from "../model/chat-message";
import { handleMessageRequest } from "./oa-service";
import { ChatModeEnum } from "../const/characteristics";

const weather = require('weather-js');

export const getWeatherLocation = async (msg: string)=> {
    const chatHistory: ChatMessage[] = [
        {
            content: `you're an geographist and you help user to find locations mentioned in text and only give the location name. for example, when I ask "hôm nay thời tiết Nha Trang có phù hợp để chạy bộ không?", you will answer "Nha Trang". first, please help me with this text: ${msg}. give me the location name only`,
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