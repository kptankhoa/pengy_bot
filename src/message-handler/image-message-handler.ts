import { Message, MessageType } from "../model/message";
import { BOT_COMMAND } from "../const/bot-command";
import { botMessageIdMap, lastInteractionModeMap } from "../const/settings/chat-mappings";
import { ChatModeEnum } from "../const/characteristics";
import { handleImageRequest } from "../service/imggen-service";

export const onImageMessage = async (bot: any, msg: Message) => {
    const chatId = msg.chat.id;
    const prompt = msg.text.replace(BOT_COMMAND.IMAGE, '').trim();
    const isPrivate = msg.chat.type === MessageType.PRIVATE;
    const res: Message = await bot.sendMessage(chatId, `Đang vẽ chờ xíu`, { reply_to_message_id: msg.message_id });
    botMessageIdMap.set(res.message_id, ChatModeEnum.no_reply);
    lastInteractionModeMap.set(chatId, ChatModeEnum.no_reply);
    bot.sendChatAction(chatId, 'typing');
    console.log(`\n\n--------image request from: ${isPrivate ? msg.chat.username : msg.chat.title}, message_id: ${msg.message_id}, time: ${new Date()}`);
    console.log(`prompt: ${prompt}`)
    const imageUrls = await handleImageRequest(prompt);
    if (!imageUrls || !imageUrls.length) {
        return bot.sendMessage(chatId, `Hư quá. vẽ cái khác đi :v`, { reply_to_message_id: msg.message_id });
    }
    const medias = imageUrls.map((url) => ({
        type: 'photo',
        media: url
    }))
    const res1: Message = await bot.sendMediaGroup(chatId, medias, { reply_to_message_id: msg.message_id });
    botMessageIdMap.set(res1.message_id, ChatModeEnum.no_reply);
    lastInteractionModeMap.set(chatId, ChatModeEnum.no_reply);
};
