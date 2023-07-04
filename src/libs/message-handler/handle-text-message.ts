import { ChatMessage, Message, MessageType, RoleEnum } from 'models';
import {
  addNewMessage,
  getChatBot,
  getChatBotRegEx,
  getChatHistory,
  handleMessageRequest,
  setBotReplyIdMode,
  setLastInteractionMode
} from 'services';
import { pepeStickerMap } from 'const/chat';

export const handleChatMessage = async (bot: any, msg: Message, mode: string) => {
  const chatId = msg.chat.id;
  const chatBot = getChatBot(mode);
  const receivedTime = Date.now();
  const chatHistory = await getChatHistory(chatId, chatBot.id);

  const chatContent = msg.text?.startsWith('/') ? msg.text.replace(getChatBotRegEx(mode), '').trim() : msg.text;
  const isPrivate = msg.chat.type === MessageType.PRIVATE;

  console.log(`\n\n--------from: ${isPrivate ? msg.chat.username : msg.chat.title}, message_id: ${msg.message_id}, mode: ${mode}, time: ${new Date().toISOString()}`);
  bot.sendChatAction(chatId, 'typing');
  const newUserMsg: ChatMessage = ({
    name: msg.from.username,
    content: chatContent,
    role: RoleEnum.USER
  });

  const replyContent = await handleMessageRequest([...chatHistory, newUserMsg], mode);

  console.log('------output------');
  console.log(`${chatBot.name}: ${replyContent}`);
  const options = { reply_to_message_id: msg.message_id };
  const stickerFileId = pepeStickerMap.get(replyContent);
  const res: Message = stickerFileId ? await bot.sendSticker(chatId, stickerFileId, options) : await bot.sendMessage(chatId, replyContent, options);
  const repliedTime = Date.now();

  const newBotMessage: ChatMessage = {
    name: chatBot.name,
    content: replyContent,
    role: RoleEnum.ASSISTANT
  };

  await addNewMessage(chatId, chatBot.id, msg.message_id, newUserMsg, receivedTime);
  await addNewMessage(chatId, chatBot.id, res.message_id, newBotMessage, repliedTime);
  await setBotReplyIdMode(chatId, res.message_id, mode);
  await setLastInteractionMode(chatId, mode);
};
