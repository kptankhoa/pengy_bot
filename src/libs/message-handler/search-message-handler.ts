import { BOT_COMMAND } from 'const/chat';
import { getWebSearchPrompt } from 'const/prompts';
import { Message } from 'models';
import { handleChatMessage } from './handle-text-message';

export const onSearchMessage = async (bot: any, msg: Message) => {
  const query = msg.text.replace(BOT_COMMAND.SEARCH, '').trim();
  const replyOptions = { reply_to_message_id: msg.message_id };

  if (!query) {
    return bot.sendMessage(msg.chat.id, 'Bạn muốn tìm gì trên web nè?', replyOptions);
  }

  const searchMessage: Message = {
    ...msg,
    text: query
  };

  return handleChatMessage(bot, searchMessage, 'search', getWebSearchPrompt());
};
