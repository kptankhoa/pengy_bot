require('dotenv').config();

export const botName = process.env.BOT_NAME || '';

export const telegramToken = process.env.BOT_TOKEN || '';

export const apiKey = process.env.OPENAI_API_KEY || '';
export const model = process.env.OPENAI_MODEL || '';
export const temperature = Number(process.env.OPENAI_TEMPERATURE || 0);
export const maximumLength = Number(process.env.OPENAI_MAXIMUM_LENGTH || 0);
export const topP = Number(process.env.OPENAI_TOP_P || 0);
export const frequencyPenalty = Number(process.env.OPENAI_FREQUENCY_PENALTY || 0);
export const presencePenalty = Number(process.env.OPENAI_PRESENCE_PENALTY || 0);
export const defaultMessage = process.env.OPENAI_DEFAULT_RESPONSE || '';
export const systemMessage = process.env.OPENAI_SYSTEM_MESSAGE || '';
export const postfix = process.env.OPENAI_POSTFIX || '';

export const completeRequestConfig = {
    model,
    max_tokens: maximumLength,
    temperature,
    top_p: topP,
    n: 1,
    stream: false,
    presence_penalty: presencePenalty,
    frequency_penalty: frequencyPenalty
}