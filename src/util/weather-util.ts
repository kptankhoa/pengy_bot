import { SimplifiedWeather, Weather } from "../model/weather";

export const simplifyWeatherObject = (weather: Weather): SimplifiedWeather => ({
    location: {
        name: weather.location.name,
        timezone: weather.location.timezone,
        alert: weather.location.alert,
        degreetype: weather.location.degreetype
    },
    current: {
        temperature: weather.current.temperature,
        skytext: weather.current.skytext,
        date: weather.current.date,
        observationtime: weather.current.observationtime,
        observationpoint: weather.current.observationpoint,
        feelslike: weather.current.feelslike,
        humidity: weather.current.humidity,
        winddisplay: weather.current.winddisplay,
        day: weather.current.day,
        shortday: weather.current.shortday,
        windspeed: weather.current.windspeed
    },
    forecast: weather.forecast.map((fc) => ({
        low: fc.low,
        high: fc.high,
        skytextday: fc.skytextday,
        date: fc.date,
        day: fc.day,
        shortday: fc.shortday
    }))
});
