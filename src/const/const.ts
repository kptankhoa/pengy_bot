require('dotenv').config();

export const botName = process.env.BOT_NAME || '';
export const telegramToken = process.env.BOT_TOKEN || '';
export const apiKey = process.env.OPENAI_API_KEY || '';
export const defaultMessage = process.env.OPENAI_DEFAULT_RESPONSE || '';
export const systemMessage = process.env.OPENAI_SYSTEM_MESSAGE || '';
export const systemMessageDev = process.env.OPENAI_SYSTEM_MESSAGE_DEV || '';
export const postfix = process.env.OPENAI_POSTFIX || '';
export const postfixDev = process.env.OPENAI_POSTFIX_DEV || '';

export const completeRequestConfig = {
    model: process.env.OPENAI_MODEL || '',
    max_tokens: Number(process.env.OPENAI_MAXIMUM_LENGTH || 0),
    temperature: Number(process.env.OPENAI_TEMPERATURE || 0),
    top_p: Number(process.env.OPENAI_TOP_P || 0),
    n: 1,
    stream: false,
    presence_penalty: Number(process.env.OPENAI_PRESENCE_PENALTY || 0),
    frequency_penalty: Number(process.env.OPENAI_FREQUENCY_PENALTY || 0)
}