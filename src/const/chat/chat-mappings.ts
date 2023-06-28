import { ChatMessage } from 'models/chat-message';

export const chatHistories: Map<string, Array<ChatMessage>> = new Map();
export const botMessageIdMap: Map<number, string> = new Map();
export const lastInteractionModeMap: Map<number, string> = new Map();
