import { SimplifiedWeather, Weather } from "../model/weather";
import { simplifyWeatherObject } from "../utils/weather-util";

const weather = require('weather-js');

export const getWeatherRequest = (search: string, callback: (weatherObj: SimplifiedWeather | null) => void) => {
    weather.find({ search, degreeType: 'C' }, (err: any, result: Weather[]) => {
        if (err || !result.length) {
            console.log('------weather error-----\n')
            console.log(err);
            callback(null);
            return;
        }
        callback(simplifyWeatherObject(result[0]));
    });
};

export const handleWeatherRequest = (search: string, callback: (weatherObject: any) => void) => {
    getWeatherRequest(search, callback);
}