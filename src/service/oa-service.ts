import {apiKey, completeRequestConfig, defaultMessage, maxTokens} from "../const/config.const";
import {ChatMessage, RoleEnum} from "../model/ChatMessage";
import { v4 as uuidv4 } from 'uuid';
import {characteristicMap, ChatModeEnum} from "../const/characteristics";
import {CreateChatCompletionRequest} from "openai/api";
import {GPTTokens, supportModelType} from 'gpt-tokens'
import {CreateImageRequest} from "openai";

const { Configuration, OpenAIApi } = require("openai");

const RETRY_TIMES = 3;
const MODEL_LIMIT_TOKENS = 4096;

const configuration = new Configuration({ apiKey });

const openai = new OpenAIApi(configuration);

const getReplyMessage = async (request: CreateChatCompletionRequest): Promise<string> => {
    let retries = 0;
    while (retries < RETRY_TIMES) {
        try {
            const completion = await openai.createChatCompletion(request);
            return completion.data.choices[0].message.content;
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
}

const getUsedTokens = (messages: ChatMessage[]): number => {
    const gptTokens = new GPTTokens({
        messages,
        model: completeRequestConfig.model as supportModelType
    });
    return gptTokens.usedTokens + maxTokens;
}

const getMessagesByLimit = (inputMessages: ChatMessage[], systemGuide: string, postfix: string): ChatMessage[] => {
    let limit = 0;
    let messages: ChatMessage[] = [];
    while (true) {
        const currentMessages = [
            {
                role: RoleEnum.SYSTEM,
                content: systemGuide
            },
            ...inputMessages
                .map((message, index) => ({
                    ...message,
                    content: (index === inputMessages.length - 1)
                        ? message.content.concat('\n' + postfix).trim()
                        : message.content
                }))
                .splice(inputMessages.length - limit)
        ];
        const tokens = getUsedTokens(currentMessages);
        if ((limit >= inputMessages.length) && (tokens <= MODEL_LIMIT_TOKENS)) {
            return currentMessages;
        }
        if ((limit >= inputMessages.length) || (tokens >= MODEL_LIMIT_TOKENS)) {
            return messages;
        }
        messages = currentMessages;
        limit++;
    }
}

export const handleMessageRequest = (chatHistory: ChatMessage[], chatMode: ChatModeEnum) => {
    const { systemGuide, postfix } = characteristicMap[chatMode];
    const messages = getMessagesByLimit(chatHistory, systemGuide, postfix);

    console.log('------input------');
    messages.map((msg) => console.log(`${msg.name || msg.role}: ${msg.content}`));

    const completionRequest = {
        messages,
        user: uuidv4(),
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
