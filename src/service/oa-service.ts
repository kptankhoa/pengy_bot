import {apiKey, completeRequestConfig, defaultMessage} from "../const/config.const";
import {ChatMessage} from "../model/ChatMessage";
import { v4 as uuidv4 } from 'uuid';

const { Configuration, OpenAIApi } = require("openai");

const RETRY_TIMES = 3;

const configuration = new Configuration({
    apiKey,
});

const openai = new OpenAIApi(configuration);

export const handleMessage = async (messages: ChatMessage[]): Promise<string> => {
    let retries = 0;
    while (retries < RETRY_TIMES) {
        try {
            const completion = await openai.createChatCompletion({
                messages,
                user: uuidv4(),
                max_tokens: 900,
                ...completeRequestConfig
            });
            return completion.data.choices[0].message.content;
        } catch (error: any) {
            if (error.response) {
                console.log(error.response.status);
                console.log(error.response.data);
            } else {
                console.log(error.message);
            }
            retries+=1;
        }
    }
    return defaultMessage;
}