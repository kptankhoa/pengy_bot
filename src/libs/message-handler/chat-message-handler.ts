import { ChatMode, Message } from 'models';
import { chatModes, getBotReplyIdMode, getLastInteractionMode } from 'services';
import { handleChatMessage } from 'libs/message-handler/handle-text-message';

export const onIncomingMessage = async (bot: any, msg: Message) => {
  const chatId = msg.chat.id;
  const chatText = msg.text;
  const replyMessageId = msg.reply_to_message?.message_id;

  const chatMode = chatModes().find((mode: ChatMode) => mode.command.test(chatText));
  if (chatMode) {
    return handleChatMessage(bot, msg, chatMode.mode);
  }

  const replyToBotMode = replyMessageId ? await getBotReplyIdMode(chatId, replyMessageId) : null;
  if (replyToBotMode && replyToBotMode !== 'no_reply') {
    return handleChatMessage(bot, msg, replyToBotMode);
  }

  const lastInteractionMode = await getLastInteractionMode(chatId);
  if (lastInteractionMode === 'no_reply') {
    return;
  }

  lastInteractionMode ? await handleChatMessage(bot, msg, lastInteractionMode) : await handleChatMessage(bot, msg, 'pengy');
};
