import {
  apiKey,
  completeRequestConfig,
  defaultMaxTokens,
  defaultMessage,
  MESSAGE_LIMIT,
  RETRY_TIMES
} from 'const/settings';
import { getChatBot } from 'services';
import { getMessagesByTokens, getName } from 'utils';
import { ChatMessage } from 'models';

const getReplyMessage = async (request: object): Promise<string> => {
  let retries = 0;
  while (retries < RETRY_TIMES) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(request)
      });
      if (!res.ok) {
        throw new Error(`status: ${res.status}, ${await res.text()}`);
      }
      const completion = await res.json<{ choices: { message?: { content?: string } }[] }>();
      return completion.choices[0].message?.content || defaultMessage;
    } catch (error: any) {
      console.error('-----error, retries time: ' + retries);
      console.error('error message: ' + error.message);
      retries++;
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
  });
};
