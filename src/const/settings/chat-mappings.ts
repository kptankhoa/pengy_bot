import { ChatMessage } from "../../model/chat-message";
import { ChatModeEnum } from "../characteristics";

export const chatHistories: Map<string, Array<ChatMessage>> = new Map();
export const botMessageIdMap: Map<number, ChatModeEnum> = new Map();
export const lastInteractionModeMap: Map<number, ChatModeEnum> = new Map();
