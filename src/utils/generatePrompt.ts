import {ChatMessage} from "../model/ChatMessage";
import {postfix, systemMessage} from "../const/const";

export const generatePrompt = (messages: ChatMessage[]) => {
    const previousMessages = messages
        .map((msg, index) => `${msg.name}: ${msg.content}${index === messages.length ? postfix : ''}\n`);
    return `${systemMessage}\n${previousMessages}`
}