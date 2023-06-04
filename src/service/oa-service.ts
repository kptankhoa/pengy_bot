import { apiKey, completeRequestConfig, defaultMaxTokens, defaultMessage } from "../const/chatbot-config.const";
import { ChatMessage } from "../model/chat-message";
import { v4 as uuidv4 } from 'uuid';
import { characteristicMap, ChatModeEnum } from "../const/characteristics";
import { CreateChatCompletionRequest } from "openai/api";
import { CreateImageRequest, Configuration, OpenAIApi } from "openai";
import { getMessagesByTokens } from "../utils/message-util";
import { RETRY_TIMES } from "../const/settings";

const configuration = new Configuration({ apiKey });

const openai = new OpenAIApi(configuration);

const getReplyMessage = async (request: CreateChatCompletionRequest): Promise<string> => {
    let retries = 0;
    while (retries < RETRY_TIMES) {
        try {
            const completion = await openai.createChatCompletion(request);
            return completion.data.choices[0].message?.content || defaultMessage;
        } catch (error: any) {
            console.log('=====error, retries time: ' + retries);
            if (error.response) {
                console.log('status: ' + error.response.status);
                console.log(error.response.data);
            } else {
                console.log('error message: ' + error.message);
            }
            retries++;
        }
    }
    return defaultMessage;
};

export const handleMessageRequest = (chatHistory: ChatMessage[], chatMode: ChatModeEnum) => {
    const { systemGuide, postfix, tokens } = characteristicMap[chatMode];
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

export const handleImageRequest = async (prompt: string) => {
    let retries = 0;
    const request: CreateImageRequest = {
        prompt,
        n: 1,
        size: "512x512",
        user: uuidv4()
    }
    while (retries < RETRY_TIMES) {
        try {
            const res = await openai.createImage(request);
            return res.data.data[0].url;
        } catch (error: any) {
            if (error.response) {
                console.log('status: ' + error.response.status);
                console.log(error.response.data);
            } else {
                console.log('error message: ' + error.message);
            }
            retries++;
        }
    }
    return null;
}
