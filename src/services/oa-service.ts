import { Configuration, CreateChatCompletionRequest, OpenAIApi } from 'openai';
import { v4 as uuidv4 } from 'uuid';
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

const configuration = new Configuration({ apiKey });

const openai = new OpenAIApi(configuration);

const getReplyMessage = async (request: CreateChatCompletionRequest): Promise<string> => {
  let retries = 0;
  while (retries < RETRY_TIMES) {
    try {
      const completion = await openai.createChatCompletion(request);
      return completion.data.choices[0].message?.content || defaultMessage;
    } catch (error: any) {
      console.error('-----error, retries time: ' + retries);
      if (error.response) {
        console.error('status: ' + error.response.status);
        console.error(error.response.data);
      } else {
        console.error('error message: ' + error.message);
      }
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
  // messages.map((msg) => console.log(`${msg.name || msg.role}: ${msg.content}`));
  [messages[0], messages[messages.length - 1]].map((msg) => console.log(`${msg.name || msg.role}: ${msg.content}`));

  const completionRequest = {
    messages,
    user: uuidv4(),
    max_tokens: maxTokens,
    ...completeRequestConfig
  };
  return getReplyMessage(completionRequest);
};
