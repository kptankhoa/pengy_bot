import { Message } from 'models';
import { BOT_COMMAND, ChatModeEnum } from 'const/chat';
import { isUrl } from 'utils';
import { handleChatMessage } from 'libs/message-handler/handle-text-message';
import { getUrlContent } from 'services';

export const onNewsMessage = async (bot: any, msg: Message) => {
  const chatContent = msg.text.replace(BOT_COMMAND.NEWS, '').trim();
  const mode = ChatModeEnum.news;
  if (!isUrl(chatContent)) {
    return handleChatMessage(bot, msg, mode);
  }
  const articleContent = await getUrlContent(chatContent);
  if (!articleContent) {
    return bot.sendMessage(msg.chat.id, 'không đọc báo dc r hehe', { reply_to_message_id: msg.message_id });
  }
  const newMsg: Message = { ...msg, text: articleContent.trim() };
  return handleChatMessage(bot, newMsg, mode);
};
