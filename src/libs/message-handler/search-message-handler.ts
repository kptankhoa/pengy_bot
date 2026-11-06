import { BOT_COMMAND } from 'const/chat';
import { getWebSearchPrompt } from 'const/prompts';
import { Message } from 'models';
import { searchWeb } from 'services';
import { handleChatMessage } from './handle-text-message';

export const onSearchMessage = async (bot: any, msg: Message) => {
  const query = msg.text.replace(BOT_COMMAND.SEARCH, '').trim();
  const replyOptions = { reply_to_message_id: msg.message_id };

  if (!query) {
    return bot.sendMessage(msg.chat.id, 'Bạn muốn tìm gì trên web nè?', replyOptions);
  }

  const results = await searchWeb(query);
  if (!results.length) {
    return bot.sendMessage(msg.chat.id, 'Mình chưa tìm được kết quả phù hợp, thử lại sau nha.', replyOptions);
  }

  const resultContext = results
    .map(({ title, url, snippet }, index) => `${index + 1}. ${title}\n${url}${snippet ? `\n${snippet}` : ''}`)
    .join('\n\n');
  const searchMessage: Message = {
    ...msg,
    text: `Câu hỏi: ${query}\n\nKết quả tìm kiếm trực tiếp:\n${resultContext}`
  };

  return handleChatMessage(bot, searchMessage, 'search', getWebSearchPrompt());
};
