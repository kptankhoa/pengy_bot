import { apiKey, completeRequestConfig, defaultMaxTokens, defaultMessage } from "../const/settings/chatbot-config";
import { ChatMessage } from "../model/chat-message";
import { v4 as uuidv4 } from 'uuid';
import { characteristicMap, ChatModeEnum } from "../const/chat/characteristics";
import { CreateChatCompletionRequest } from "openai/api";
import { Configuration, OpenAIApi } from "openai";
import { getMessagesByTokens } from "../utils/message-util";
import { RETRY_TIMES } from "../const/settings/settings";
import { getPengyPrompt } from "../const/prompts";
import { getDictionary } from "./firebase-service";

const configuration = new Configuration({ apiKey });

const openai = new OpenAIApi(configuration);

const getReplyMessage = async (request: CreateChatCompletionRequest): Promise<string> => {
    let retries = 0;
    while (retries < RETRY_TIMES) {
        try {
            const completion = await openai.createChatCompletion(request);
            return completion.data.choices[0].message?.content || defaultMessage;
        } catch (error: any) {
            console.error('-----error, retries time: ' + retries);
            if (error.response) {
                console.error('status: ' + error.response.status);
                console.error(error.response.data);
            } else {
                console.error('error message: ' + error.message);
            }
            retries++;
        }
    }
    return defaultMessage;
};

export const handleMessageRequest = async (chatHistory: ChatMessage[], chatMode: ChatModeEnum) => {
    const { systemGuide: guide, postfix, tokens } = characteristicMap[chatMode];
    const systemGuide = chatMode === ChatModeEnum.pengy ? getPengyPrompt(await getDictionary()) : guide;
    const maxTokens = tokens || defaultMaxTokens;
    const messages = getMessagesByTokens(chatHistory, maxTokens, systemGuide, postfix);

    console.log('------input------');
    messages.map((msg) => console.log(`${msg.name || msg.role}: ${msg.content}`));

    const completionRequest = {
        messages,
        user: uuidv4(),
        max_tokens: maxTokens,
        ...completeRequestConfig
    };
    return getReplyMessage(completionRequest);
}
