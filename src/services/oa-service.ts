import {
  apiKey,
  baseUrl,
  completeRequestConfig,
  defaultMaxTokens,
  defaultMessage,
  MESSAGE_LIMIT,
  RETRY_TIMES
} from 'const/settings';
import { getChatBot } from 'services';
import { getMessagesByTokens, getName, getUsedTokens } from 'utils';
import { ChatMessage } from 'models';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Workers cancel waitUntil work 30s after the response, so the LLM step must finish well inside that.
const ATTEMPT_TIMEOUT_MS = 18_000;
const LLM_BUDGET_MS = 22_000;

class NonRetryableError extends Error {}

const getReplyMessage = async (request: object, estimatedTokens: number): Promise<string> => {
  let retries = 0;
  const started = Date.now();
  while (retries < RETRY_TIMES) {
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        signal: AbortSignal.timeout(Math.min(ATTEMPT_TIMEOUT_MS, LLM_BUDGET_MS - (Date.now() - started))),
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(request)
      });
      if (!res.ok) {
        const message = `status: ${res.status}, ${await res.text()}`;
        // 4xx other than rate limiting won't change on retry
        throw res.status >= 400 && res.status < 500 && res.status !== 429 ? new NonRetryableError(message) : new Error(message);
      }
      const completion = await res.json<{ choices: { message?: { content?: string } }[], usage?: { prompt_tokens: number } }>();
      // compare with getUsedTokens' chars/3 guess to tune it
      console.log(`llm ${Date.now() - started}ms, prompt tokens: estimated ${estimatedTokens}, actual ${completion.usage?.prompt_tokens}`);
      return completion.choices[0].message?.content || defaultMessage;
    } catch (error: any) {
      console.error('-----error, retries time: ' + retries);
      console.error('error message: ' + error.message);
      if (error instanceof NonRetryableError) {
        break;
      }
      retries++;
      if (Date.now() - started + 500 * 2 ** retries >= LLM_BUDGET_MS) {
        break;
      }
      await sleep(500 * 2 ** retries);
    }
  }
  return defaultMessage;
};

export const handleMessageRequest = async (chatHistory: ChatMessage[], chatMode: string, extraPrompt = '') => {
  const { postfix, systemGuide, tokens } = getChatBot(chatMode);
  const maxTokens = tokens || defaultMaxTokens;
  const guide = systemGuide.concat(extraPrompt);
  const shortenHistory = [...chatHistory]
    .splice(chatHistory.length - MESSAGE_LIMIT)
    .map((msg: ChatMessage) => ({ ...msg, name: getName(msg.name || '') }));
  const messages = getMessagesByTokens(shortenHistory, maxTokens, guide, postfix);
  console.log('------input------');
  [messages[0], messages[messages.length - 1]].map((msg) => console.log(`${msg.name || msg.role}: ${msg.content}`));

  return getReplyMessage({
    messages,
    max_tokens: maxTokens,
    ...completeRequestConfig
  }, getUsedTokens(messages, 0));
};
