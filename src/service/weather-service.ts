import { SimplifiedWeather, Weather } from "../model/weather";
import { simplifyWeatherObject } from "../utils/weather-util";
import { ChatMessage, RoleEnum } from "../model/chat-message";
import { handleMessageRequest } from "./oa-service";
import { ChatModeEnum } from "../const/chat/characteristics";
import { getWeatherLocationPrompt } from "../const/prompts";

const weather = require('weather-js');

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
            console.error('------weather error-----')
            console.error({ err, result });
            callback(null);
            return;
        }
        callback(simplifyWeatherObject(result[0]));
    });
};

export const handleWeatherRequest = (search: string, callback: (weatherObject: any) => void) => {
    getWeatherRequest(search, callback);
}