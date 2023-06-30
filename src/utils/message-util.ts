import { ChatMessage, RoleEnum } from 'models';
import { GPTTokens, supportModelType } from 'gpt-tokens';
import { completeRequestConfig, MODEL_LIMIT_TOKENS } from 'const/settings';

const getUsedTokens = (messages: ChatMessage[], maxTokens: number): number => {
  const gptTokens = new GPTTokens({
    messages,
    model: completeRequestConfig.model as supportModelType
  });
  return gptTokens.usedTokens + maxTokens;
};

export const getMessagesByTokens = (inputMessages: ChatMessage[], maxTokens: number, systemGuide: string, postfix: string): ChatMessage[] => {
  let limit = 0;
  let messages: ChatMessage[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const currentMessages = [
      ...systemGuide ? [{
        role: RoleEnum.SYSTEM,
        content: systemGuide
      }] : [],
      ...inputMessages
        .map((message, index) => ({
          ...message,
          content: (index === inputMessages.length - 1)
            ? (message.content || '').concat('\n' + postfix).trim()
            : message.content
        }))
        .splice(inputMessages.length - limit)
    ];
    const tokens = getUsedTokens(currentMessages, maxTokens);
    if ((limit >= inputMessages.length) && (tokens <= MODEL_LIMIT_TOKENS)) {
      return currentMessages;
    }
    if ((limit >= inputMessages.length) || (tokens >= MODEL_LIMIT_TOKENS)) {
      return messages;
    }
    messages = currentMessages;
    limit++;
  }
};