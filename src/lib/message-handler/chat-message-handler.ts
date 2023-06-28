import { Message, MessageType } from 'model/message';
import { characteristicMap, ChatModeEnum, chatModes, getChatBotRegEx } from 'const/chat/characteristics';
import { botMessageIdMap, chatHistories, lastInteractionModeMap } from 'const/chat/chat-mappings';
import { defaultBotName } from 'const/settings/chatbot-config';
import { RoleEnum } from 'model/chat-message';
import { handleMessageRequest } from 'service/oa-service';
import { getChatHistoryKey } from 'util/common-util';

export const handleChatMessage = async (bot: any, msg: Message, mode: ChatModeEnum) => {
  const chatId = msg.chat.id;
  const historyId = getChatHistoryKey(mode, chatId);
  const chatHistory = chatHistories.get(historyId) || [];

  const chatContent = msg.text?.startsWith('/') ? msg.text.replace(getChatBotRegEx(mode), '').trim() : msg.text;
  const isPrivate = msg.chat.type === MessageType.PRIVATE;
  const botName = characteristicMap[mode]?.name || defaultBotName;

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

export const onIncomingMessage = (bot: any, msg: Message) => {
  const chatText = msg.text;
  const replyMessageId = msg.reply_to_message?.message_id;
  const chatId = msg.chat.id;

  const chatMode = chatModes.find((mode) => mode.command.test(chatText));
  if (chatMode) {
    return handleChatMessage(bot, msg, chatMode.mode);
  }

  const replyToBotMode = replyMessageId ? botMessageIdMap.get(replyMessageId) : null;
  if (replyToBotMode && replyToBotMode !== ChatModeEnum.no_reply) {
    return handleChatMessage(bot, msg, replyToBotMode);
  }

  const lastInteractionMode = lastInteractionModeMap.get(chatId);
  if (lastInteractionMode === ChatModeEnum.no_reply) {
    return;
  }

  lastInteractionMode ? handleChatMessage(bot, msg, lastInteractionMode) : handleChatMessage(bot, msg, ChatModeEnum.pengy);
};
