import { ChatMessage, RoleEnum } from 'models';
import { MODEL_LIMIT_TOKENS } from 'const/settings';

// shortcut: ~3 chars/token estimate instead of a real tokenizer (js-tiktoken is 5MB of Worker bundle); swap in a real one if trimming proves too loose or too tight
const getUsedTokens = (messages: ChatMessage[], maxTokens: number): number =>
  messages.reduce((sum, { content, name }) => sum + Math.ceil(((content || '').length + (name || '').length) / 3) + 4, maxTokens);

export const getMessagesByTokens = (inputMessages: ChatMessage[], maxTokens: number, systemGuide: string, postfix: string): ChatMessage[] => {
  let limit = 0;
  let messages: ChatMessage[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const currentMessages = [
      ...systemGuide ? [{
        role: RoleEnum.SYSTEM,
        content: systemGuide,
        name: 'system'
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
