import { Message, MessageType } from 'models';
import { BOT_COMMAND } from 'const/chat';
import { handleImageRequest, setBotReplyIdMode, setLastInteractionMode } from 'services';

export const onImageMessage = async (bot: any, msg: Message) => {
  const chatId = msg.chat.id;
  const prompt = msg.text.replace(BOT_COMMAND.IMAGE, '').trim();
  const isPrivate = msg.chat.type === MessageType.PRIVATE;

  const res: Message = await bot.sendMessage(chatId, 'Đang vẽ chờ xíu', { reply_to_message_id: msg.message_id });

  bot.sendChatAction(chatId, 'typing');

  console.log(`\n\n--------image request from: ${isPrivate ? msg.chat.username : msg.chat.title}, message_id: ${msg.message_id}, time: ${new Date()}`);
  console.log(`prompt: ${prompt}`);
  const imageUrls = await handleImageRequest(prompt);
  if (!imageUrls || !imageUrls.length) {
    return bot.sendMessage(chatId, 'Hư quá. vẽ cái khác đi :v', { reply_to_message_id: msg.message_id });
  }

  const medias = imageUrls.map((url) => ({
    type: 'photo',
    media: url
  }));
  const res1: Message = await bot.sendMediaGroup(chatId, medias, { reply_to_message_id: msg.message_id });

  await setBotReplyIdMode(chatId, res.message_id, 'no_reply');
  await setBotReplyIdMode(chatId, res1.message_id, 'no_reply');
  await setLastInteractionMode(chatId, 'no_reply');
};
