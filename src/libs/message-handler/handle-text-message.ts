import { Message, MessageType, RoleEnum } from 'models';
import { getChatHistoryKey } from 'utils';
import { botMessageIdMap, chatHistories, lastInteractionModeMap } from 'const/chat';
import { getChatBot, getChatBotRegEx, handleMessageRequest } from 'services';

export const handleChatMessage = async (bot: any, msg: Message, mode: string) => {
  const chatId = msg.chat.id;
  const historyId = getChatHistoryKey(mode, chatId);
  const chatHistory = chatHistories.get(historyId) || [];

  const chatContent = msg.text?.startsWith('/') ? msg.text.replace(getChatBotRegEx(mode), '').trim() : msg.text;
  const isPrivate = msg.chat.type === MessageType.PRIVATE;
  const botName = getChatBot(mode).name;

  console.log(`\n\n--------from: ${isPrivate ? msg.chat.username : msg.chat.title}, message_id: ${msg.message_id}, mode: ${mode}, time: ${new Date()}`);
  bot.sendChatAction(chatId, 'typing');
  chatHistory.push({
    name: msg.from.username,
    content: chatContent,
    role: RoleEnum.USER
  });

  const replyContent = await handleMessageRequest(chatHistory, mode);
  console.log('------output------');
  console.log(`${botName}: ${replyContent}`);

  const res: Message = await bot.sendMessage(chatId, replyContent, { reply_to_message_id: msg.message_id });
  chatHistory.push({
    name: botName,
    content: replyContent,
    role: RoleEnum.ASSISTANT
  });

  botMessageIdMap.set(res.message_id, mode);
  lastInteractionModeMap.set(chatId, mode);
  chatHistories.set(historyId, chatHistory);
};