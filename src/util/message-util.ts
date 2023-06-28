import { ChatMessage, RoleEnum } from "../model/chat-message";
import { GPTTokens, supportModelType } from "gpt-tokens";
import { completeRequestConfig } from "../const/settings/chatbot-config";

const MODEL_LIMIT_TOKENS = 4096 * 4;

const getUsedTokens = (messages: ChatMessage[], maxTokens: number): number => {
    const gptTokens = new GPTTokens({
        messages,
        model: completeRequestConfig.model as supportModelType
    });
    return gptTokens.usedTokens + maxTokens;
};

export const getMessagesByTokens = (inputMessages: ChatMessage[], maxTokens: number, systemGuide: string, postfix: string): ChatMessage[] => {
    let limit = 0;
    let messages: ChatMessage[] = [];
    while (true) {
        const currentMessages = [
            ...systemGuide ? [{
                role: RoleEnum.SYSTEM,
                content: systemGuide
            }] : [],
            ...inputMessages
                .map((message, index) => ({
                    ...message,
                    content: (index === inputMessages.length - 1)
                        ? (message.content || '').concat('\n' + postfix).trim()
                        : message.content
                }))
                .splice(inputMessages.length - limit)
        ];
        const tokens = getUsedTokens(currentMessages, maxTokens);
        if ((limit >= inputMessages.length) && (tokens <= MODEL_LIMIT_TOKENS)) {
            return currentMessages;
        }
        if ((limit >= inputMessages.length) || (tokens >= MODEL_LIMIT_TOKENS)) {
            return messages;
        }
        messages = currentMessages;
        limit++;
    }
};