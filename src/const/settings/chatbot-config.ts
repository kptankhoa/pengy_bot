require('dotenv').config();

export const defaultBotName = process.env.BOT_NAME || '';

export const telegramToken = process.env.BOT_TOKEN || '';

export const apiKey = process.env.OPENAI_API_KEY || '';

export const defaultMessage = process.env.OPENAI_DEFAULT_RESPONSE || '';

export const defaultMaxTokens = Number(process.env.OPENAI_DEFAULT_MAX_TOKENS || 0);

export const completeRequestConfig = {
  model: process.env.OPENAI_MODEL || '',
  temperature: Number(process.env.OPENAI_TEMPERATURE || 0),
  top_p: Number(process.env.OPENAI_TOP_P || 0),
  n: 1,
  stream: false,
  presence_penalty: Number(process.env.OPENAI_PRESENCE_PENALTY || 0),
  frequency_penalty: Number(process.env.OPENAI_FREQUENCY_PENALTY || 0)
};

export const mode = process.env.ENV_NODE || '';
