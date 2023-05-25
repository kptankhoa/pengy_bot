import {apiKey, completeRequestConfig, defaultMessage} from "../const/config.const";
import {ChatMessage, RoleEnum} from "../model/ChatMessage";
import { v4 as uuidv4 } from 'uuid';
import {characteristicMap, ChatModeEnum} from "../const/characteristics";
import {CreateChatCompletionRequest} from "openai/api";
import {GPTTokens, supportModelType} from 'gpt-tokens'

const { Configuration, OpenAIApi } = require("openai");

const RETRY_TIMES = 3;
const MESSAGE_LIMIT = 20;
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

const getMessagesByLimit = (inputMessages: ChatMessage[], inputLimit: number, systemGuide: string, postfix: string): ChatMessage[] => {
    const messages = [
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
            .splice(inputMessages.length - inputLimit)
    ];
    const gptTokens = new GPTTokens({
        messages,
        model: completeRequestConfig.model as supportModelType
    });
    if (gptTokens.usedTokens < MODEL_LIMIT_TOKENS) {
        console.log(`---usedTokens: ${gptTokens.usedTokens}`)
        return messages;
    }
    return getMessagesByLimit(inputMessages, inputLimit - 1, systemGuide, postfix);
}

export const handleMessages = (chatHistory: ChatMessage[], chatMode: ChatModeEnum) => {
    const { systemGuide, postfix, limit } = characteristicMap[chatMode];
    const messages = getMessagesByLimit(chatHistory, limit ?? MESSAGE_LIMIT, systemGuide, postfix);

    console.log('------input------');
    messages.map((msg) => console.log(`${msg.name || msg.role}: ${msg.content}`));

    const completionRequest = {
        messages,
        user: uuidv4(),
        ...completeRequestConfig
    };
    return getReplyMessage(completionRequest);
}