import { ChatMessage } from "models";
export const convertFirebaseMessageToChatMessage = (fbMsg: any): ChatMessage => ({
    name: fbMsg.name,
    role: fbMsg.role,
    content: fbMsg.content
})