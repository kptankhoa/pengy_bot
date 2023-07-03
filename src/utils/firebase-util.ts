import { ChatMessage } from 'models';

export const convertFirebaseMessageToChatMessage = (fbMsg: any): ChatMessage => ({
  name: fbMsg.name,
  role: fbMsg.role,
  content: fbMsg.content
});

export const getChatHistoryKey = (chatId: number, mode: string) => `${chatId}_${mode}`;

export const getBotReplyIdKey = (chatId: number, msgId: number) => `${chatId}_${msgId}`;
