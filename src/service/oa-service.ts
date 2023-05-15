import {apiKey, completeRequestConfig, defaultMessage, postfix, systemMessage} from "../const/const";
import {ChatMessage, RoleEnum} from "../model/ChatMessage";

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    apiKey,
});
const openai = new OpenAIApi(configuration);

const getMessages = (messages: ChatMessage[]) => {
    return [
        {
            role: RoleEnum.SYSTEM,
            content: systemMessage
        },
        ...messages.map((message, index) => ({
            ...message,
            content: index === messages.length - 1 ? message.content.concat(postfix) : message.content
        }))
    ]
}

export const handleMessage = async (messages: ChatMessage[]) => {
    try {
        const completion = await openai.createChatCompletion({
            messages: getMessages(messages),
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