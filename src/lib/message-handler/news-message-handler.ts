import { Message } from "../../model/message";
import { BOT_COMMAND } from "../../const/chat/bot-command";
import { ChatModeEnum } from "../../const/chat/characteristics";
import { isUrl } from "../../util/common-util";
import { getUrlContent } from "../../service/news-service";
import { handleChatMessage } from "./chat-message-handler";

export const onNewsMessage = async (bot: any, msg: Message) => {
    const chatContent = msg.text.replace(BOT_COMMAND.NEWS, '').trim();
    const mode = ChatModeEnum.news;
    if (!isUrl(chatContent)) {
        return handleChatMessage(bot, msg, mode);
    }
    const articleContent = await getUrlContent(chatContent);
    if (!articleContent) {
        return bot.sendMessage(msg.chat.id, 'không đọc báo dc r hehe', { reply_to_message_id: msg.message_id });
    }
    const newMsg: Message = { ...msg, text: articleContent.trim() };
    return handleChatMessage(bot, newMsg, mode);
};
