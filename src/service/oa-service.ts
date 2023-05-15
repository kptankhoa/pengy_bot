import {apiKey, completeRequestConfig, defaultMessage, postfix, systemMessage} from "../const/const";
import {ChatMessage} from "../model/ChatMessage";
import { v4 as uuidv4 } from 'uuid';


const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    apiKey,
});
const openai = new OpenAIApi(configuration);

export const handleMessage = async (messages: ChatMessage[]): Promise<string> => {
    try {
        const completion = await openai.createChatCompletion({
            messages,
            user: uuidv4(),
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
        return defaultMessage;
    }
}