import {apiKey, completeRequestConfig, defaultMessage, systemMessage} from "../const/const";
import {ChatMessage, RoleEnum} from "../model/ChatMessage";

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    apiKey,
});
const openai = new OpenAIApi(configuration);

export const handleMessage = async (messages: ChatMessage[]) => {
    const completeMessages: ChatMessage[] = [
        {
            role: RoleEnum.SYSTEM,
            content: systemMessage
        },
        ...messages
    ];
    try {
        const completion = await openai.createChatCompletion({
            messages: completeMessages,
            ...completeRequestConfig
        });
        console.log(completion.data.choices)
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