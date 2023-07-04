import { ChatBot, ChatMessage } from 'models';

export const chatHistoryMap: Map<string, ChatMessage[]> = new Map();

export const botReplyIdMap: Map<string, string> = new Map();

export const lastInteractionModeMap: Map<string, string> = new Map();

export const chatBotMap = new Map<string, ChatBot>();

export const pepeStickerMap = new Map<string, string>();
