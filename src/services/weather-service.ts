import { ChatMessage, RoleEnum } from 'models';
import { getWeatherLocationPrompt } from 'const/prompts';
import { handleMessageRequest } from 'services';

export const getWeatherLocation = async (msg: string)=> {
  const chatHistory: ChatMessage[] = [
    {
      content: getWeatherLocationPrompt(msg),
      role: RoleEnum.USER,
      name: 'user'
    }
  ];
  return await handleMessageRequest(chatHistory, 'empty');
};

// Open-Meteo: keyless geocoding + forecast. daily[0] is today.
export const getWeatherRequest = async (search: string): Promise<object | null> => {
  console.log(`-----weather: search: ${search}`);
  try {
    const geo = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(search)}`))
      .json<{ results?: { name: string, country: string, latitude: number, longitude: number }[] }>();
    const place = geo.results?.[0];
    if (!place) {
      return null;
    }
    const params = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'auto',
      forecast_days: '5'
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!res.ok) {
      throw new Error(`status: ${res.status}`);
    }
    const { current, daily } = await res.json<{ current: object, daily: object }>();
    return { location: `${place.name}, ${place.country}`, note: 'weather_code is WMO code', current, daily };
  } catch (err) {
    console.error('------weather error-----');
    console.error(err);
    return null;
  }
};
