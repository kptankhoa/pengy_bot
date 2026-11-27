
export const defaultBotName = process.env.BOT_NAME || '';

export const telegramToken = process.env.BOT_TOKEN || '';

export const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');

export const apiKey = process.env.OPENAI_API_KEY || '';

export const tavilyApiKey = process.env.TAVILY_API_KEY || '';

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

export const blockedUserIds = new Set((process.env.BLOCKED_USER_IDS || '').split(',').map(id => id.trim()).filter(Boolean));

export const blockedMessage = process.env.BLOCKED_MESSAGE || 'Bạn đã bị chặn sử dụng Pengy';

export const bannedKeywords = (process.env.BANNED_KEYWORDS || '').split(',').map(word => word.trim().toLowerCase()).filter(Boolean);

export const bannedMessage = process.env.BANNED_MESSAGE || 'Nói bậy bị cấm chat 5 phút nha';

export const banCommandUserIds = (process.env.BAN_COMMAND_USER_IDS || '').split(',').map(id => Number(id.trim())).filter(Boolean);
