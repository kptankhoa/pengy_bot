import { Message } from 'models';
import { botMessageIdMap, lastInteractionModeMap } from 'const/chat';
import { chatModes } from 'services';
import { handleChatMessage } from 'libs/message-handler/handle-text-message';

export const onIncomingMessage = (bot: any, msg: Message) => {
  const chatText = msg.text;
  const replyMessageId = msg.reply_to_message?.message_id;
  const chatId = msg.chat.id;

  const chatMode = chatModes().find((mode) => mode.command.test(chatText));
  if (chatMode) {
    return handleChatMessage(bot, msg, chatMode.mode);
  }

  const replyToBotMode = replyMessageId ? botMessageIdMap.get(replyMessageId) : null;
  if (replyToBotMode && replyToBotMode !== 'no_reply') {
    return handleChatMessage(bot, msg, replyToBotMode);
  }

  const lastInteractionMode = lastInteractionModeMap.get(chatId);
  if (lastInteractionMode === 'no_reply') {
    return;
  }

  lastInteractionMode ? handleChatMessage(bot, msg, lastInteractionMode) : handleChatMessage(bot, msg, 'pengy');
};
