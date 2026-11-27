import { STICKER_SET, blockedUserIds, blockedMessage, bannedMessage, telegramToken, banCommandUserIds } from 'const/settings';
import { Message } from 'models';
import { getMessageHandler } from 'libs/message-handler';
import { BOT_COMMAND, NOTI_GROUP_ID, pepeStickerMap } from 'const/chat';
import { Sticker } from 'models/sticker';
import { checkChatIdExist, clearMuteRestore, ensureChatConfig, loadChatConfigs, recordMute, takeDueMuteRestores } from 'libs/firebase';
import { getBannedKeywords, loadChatBots } from 'services';
import { createBot } from 'libs/telegram';
import { cached } from 'utils/cache-util';

const bot = createBot();
const MUTE_SECONDS = 5 * 60;
const MUTED = Object.fromEntries(['messages', 'audios', 'documents', 'photos', 'videos', 'video_notes', 'voice_notes', 'polls', 'other_messages']
  .map((kind) => [`can_send_${kind}`, false]));
const TEXT_ONLY = {
  can_send_messages: true,
  can_send_audios: false,
  can_send_documents: false,
  can_send_photos: false,
  can_send_videos: false,
  can_send_video_notes: false,
  can_send_voice_notes: false,
  can_send_polls: false,
  can_send_other_messages: false,
  can_add_web_page_previews: false,
  can_change_info: false,
  can_invite_users: false,
  can_pin_messages: false,
  can_manage_topics: false
};

// Fails (logged) if the bot isn't admin, the user is, or the user isn't in the chat.
const muteUser = (chatId: number, userId: number) => bot.getChatMember(chatId, userId)
  .then(() => recordMute(chatId, userId, Date.now() + MUTE_SECONDS * 1000))
  .then(() => bot.restrictChatMember(chatId, userId, MUTED, Math.floor(Date.now() / 1000) + MUTE_SECONDS))
  .catch(console.error);

// Timed mutes expire into text-only permissions; the cron may apply them up to a minute late.
export const runMuteRestores = async () => {
  for (const { restore, done } of await takeDueMuteRestores()) {
    await bot.restrictChatMember(restore.chatId, restore.userId, TEXT_ONLY, 0)
      .then(done)
      .catch(console.error); // left in place, retried next minute
  }
};

// Bot tokens are "<bot id>:<secret>"
const botId = telegramToken.split(':')[0];

const loadStickers = cached(async () => {
  const res = await bot.getStickerSet(STICKER_SET);
  [...(res?.stickers || [])].reverse()
    .forEach((sticker: Sticker) => pepeStickerMap.set(sticker.emoji, sticker.file_id));
}, 60 * 60_000);

const notifyNewChatId = async (msg: Message) => {
  const chatId = msg.chat.id;
  if (!await checkChatIdExist(chatId)) {
    const newMsgNoti = 'Mới có chat mới';
    const json = JSON.stringify(msg, null, 2);
    await bot.sendMessage(NOTI_GROUP_ID, `${newMsgNoti}\n${json}`, {
      entities: [{ offset: newMsgNoti.length + 1, length: json.length, type: 'code' } ]
    });
  }
};

const onTextMsg = (msg: Message) => {
  const messageHandler = getMessageHandler(bot);
  const chatText = msg.text;

  if (BOT_COMMAND.RESET.test(chatText)) {
    return messageHandler.onReset(msg);
  }

  if (BOT_COMMAND.IMAGE.test(chatText)) {
    return messageHandler.onImage(msg);
  }

  if (BOT_COMMAND.WEATHER.test(chatText)) {
    return messageHandler.onWeather(msg);
  }

  if (BOT_COMMAND.NEWS.test(chatText)) {
    return messageHandler.onNews(msg);
  }

  if (BOT_COMMAND.SEARCH.test(chatText)) {
    return messageHandler.onSearch(msg);
  }

  if (BOT_COMMAND.DICT.test(chatText)) {
    return messageHandler.onDictionary(msg);
  }

  if (BOT_COMMAND.FUND.test(chatText)) {
    return messageHandler.onFund(msg);
  }

  if (BOT_COMMAND.PRICE.test(chatText)) {
    return messageHandler.onPrice(msg);
  }

  if (BOT_COMMAND.CHAT_INFO.test(chatText)) {
    return messageHandler.onChatInfo(msg);
  }

  if (BOT_COMMAND.NOTE.test(chatText)) {
    return messageHandler.onNote(msg);
  }

  if (BOT_COMMAND.BAN_WORD.test(chatText)) {
    return messageHandler.onBanWord(msg);
  }

  return messageHandler.onNewMessage(msg);
};

interface CallbackQuery {
  id: string;
  data?: string;
  message?: { message_id: number, chat: { id: number }, reply_to_message?: Message };
}

// Per-isolate guard against double taps on the same retry button
const retrying = new Set<number>();

export const handleUpdate = async (update: { message?: Message, callback_query?: CallbackQuery }) => {
  const callback = update.callback_query;
  if (callback?.data === 'retry') {
    await bot.answerCallbackQuery(callback.id);
    const failedReply = callback.message;
    const original = failedReply?.reply_to_message;
    if (!failedReply || !original?.text || retrying.has(failedReply.message_id)) {
      return;
    }
    retrying.add(failedReply.message_id);
    await bot.deleteMessage(failedReply.chat.id, failedReply.message_id);
    return run(original);
  }
  if (update.message?.text) {
    return run(update.message);
  }
};

const run = async (msg: Message) => {
  console.log(`user ${msg.from?.id} (@${msg.from?.username || msg.from?.first_name}) in ${msg.chat.type} ${msg.chat.id}`);
  const lowerText = msg.text.toLowerCase();
  const isBlockedUser = blockedUserIds.has(String(msg.from?.id));
  const isBanWordCommand = BOT_COMMAND.BAN_WORD.test(msg.text);
  const isFreeCommand = BOT_COMMAND.FREE.test(msg.text);
  if (msg.chat.type !== 'private' && isBlockedUser && msg.from?.id && !isBanWordCommand && !isFreeCommand && (await getBannedKeywords()).some(word => lowerText.includes(word))) {
    await muteUser(msg.chat.id, msg.from.id);
    return bot.sendMessage(msg.chat.id, bannedMessage, { reply_to_message_id: msg.message_id, message_thread_id: msg.message_thread_id });
  }
  if (isBlockedUser) {
    return bot.sendMessage(msg.chat.id, blockedMessage, { reply_to_message_id: msg.message_id, message_thread_id: msg.message_thread_id });
  }
  const isForBot = msg.chat.type === 'private' || msg.text.startsWith('/') || String(msg.reply_to_message?.from?.id) === botId;
  if (msg.chat.type !== 'private' && BOT_COMMAND.BAN.test(msg.text) && banCommandUserIds.length) {
    await Promise.all(banCommandUserIds.map((userId) => muteUser(msg.chat.id, userId)));
    return bot.sendMessage(msg.chat.id, bannedMessage, { message_thread_id: msg.message_thread_id });
  }
  if (msg.chat.type !== 'private' && isFreeCommand) {
    const results = await Promise.all([...blockedUserIds].map(async (userId) => {
      try {
        await bot.restrictChatMember(msg.chat.id, Number(userId), TEXT_ONLY, 0);
        await clearMuteRestore(msg.chat.id, Number(userId));
        return true;
      } catch (error) {
        console.error(`Failed to free blocked user ${userId} in chat ${msg.chat.id}`, error);
        return false;
      }
    }));
    const freedCount = results.filter(Boolean).length;
    return bot.sendMessage(msg.chat.id, `Đã gỡ hạn chế cho ${freedCount}/${results.length} tài khoản trong nhóm này.`, { message_thread_id: msg.message_thread_id });
  }
  // As admin the bot sees every group message; like privacy mode, only answer commands and replies to the bot
  if (msg.chat.type !== 'private' && !isForBot) {
    return;
  }
  const stopTyping = bot.startTyping(msg.chat.id);
  try {
    await processMessage(msg);
  } finally {
    stopTyping();
  }
};

const processMessage = async (msg: Message) => {
  await Promise.all([loadChatBots(), loadChatConfigs(), loadStickers().catch(console.error), notifyNewChatId(msg).catch(console.error)]);
  await ensureChatConfig(msg.chat.id);
  await onTextMsg(msg);
};
