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
import { getChatBot, getDictionary } from 'services';
import { getMessagesByTokens, printWithoutWord } from 'utils';
import { getExtraVocabularyPrompt, getTimePrompt } from 'const/prompts';
import { ChatMessage, DictWord } from 'models';
import { extraVocabModes, useExtraVocab } from 'libs/firebase';

const configuration = new Configuration({ apiKey });

const openai = new OpenAIApi(configuration);

const buildSystemGuide = (mode: string): string => {
  const { systemGuide } = getChatBot(mode);
  let guide;
  if (useExtraVocab() && extraVocabModes().includes(mode)) {
    const dictWords = getDictionary();
    const vocabs = dictWords.reduce((prev: any, curr: DictWord) => ({ ...prev, [curr.word]: printWithoutWord(curr) }), {});
    guide = systemGuide.concat(getExtraVocabularyPrompt(vocabs), getTimePrompt());
  } else {
    guide = systemGuide.concat(getTimePrompt());
  }

  return guide;
};

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

export const handleMessageRequest = (chatHistory: ChatMessage[], chatMode: string) => {
  const { postfix, tokens } = getChatBot(chatMode);

  const maxTokens = tokens || defaultMaxTokens;
  const systemGuide = buildSystemGuide(chatMode);
  const shortenHistory = [...chatHistory].splice(chatHistory.length - MESSAGE_LIMIT);
  const messages = getMessagesByTokens(shortenHistory, maxTokens, systemGuide, postfix);
  console.log('------input------');
  messages.map((msg) => console.log(`${msg.name || msg.role}: ${msg.content}`));

  const completionRequest = {
    messages,
    user: uuidv4(),
    max_tokens: maxTokens,
    ...completeRequestConfig
  };
  return getReplyMessage(completionRequest);
};
