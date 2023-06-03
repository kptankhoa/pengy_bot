const weather = require('weather-js');

export const getWeatherRequest = (search: string, callback: (result: any) => void) => {
    weather.find({ search, degreeType: 'C' }, (err: any, result: any) => {
        if (err) {
            console.log('------weather error-----\n')
            console.log(err);
            callback(null);
        }
        callback(result[0]);
    });
};

export const handleWeatherRequest = (search: string, callback: (weatherObject: any) => void) => {
    getWeatherRequest(search, callback);
}