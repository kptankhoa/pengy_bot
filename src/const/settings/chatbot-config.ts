
export const defaultBotName = process.env.BOT_NAME || '';

export const telegramToken = process.env.BOT_TOKEN || '';

export const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');

export const apiKey = process.env.OPENAI_API_KEY || '';

export const webSearchApiKey = process.env.WEB_SEARCH_API_KEY || '';

export const defaultMessage = process.env.OPENAI_DEFAULT_RESPONSE || '';

export const defaultMaxTokens = Number(process.env.OPENAI_DEFAULT_MAX_TOKENS || 0);

export const completeRequestConfig = {
  model: process.env.OPENAI_MODEL || '',
  temperature: Number(process.env.OPENAI_TEMPERATURE || 0),
  top_p: Number(process.env.OPENAI_TOP_P || 0),
  n: 1,
  stream: false,
  // Gemini: 'none' (2.5 models) or 'low' cuts thinking time
  ...process.env.OPENAI_REASONING_EFFORT && { reasoning_effort: process.env.OPENAI_REASONING_EFFORT },
  ...Number(process.env.OPENAI_PRESENCE_PENALTY) && { presence_penalty: Number(process.env.OPENAI_PRESENCE_PENALTY) },
  ...Number(process.env.OPENAI_FREQUENCY_PENALTY) && { frequency_penalty: Number(process.env.OPENAI_FREQUENCY_PENALTY) }
};

export const webhookSecret = process.env.WEBHOOK_SECRET || '';
