import { STICKER_SET, blockedUserIds, blockedMessage, bannedKeywords, bannedMessage, telegramToken } from 'const/settings';
import { Message } from 'models';
import { getMessageHandler } from 'libs/message-handler';
import { BOT_COMMAND, NOTI_GROUP_ID, pepeStickerMap } from 'const/chat';
import { Sticker } from 'models/sticker';
import { checkChatIdExist, ensureChatConfig, loadChatConfigs, recordMute, takeDueMuteRestores } from 'libs/firebase';
import { loadChatBots } from 'services';
import { createBot } from 'libs/telegram';
import { cached } from 'utils/cache-util';

const bot = createBot();
const MUTE_SECONDS = 5 * 60;
const MUTED = Object.fromEntries(['messages', 'audios', 'documents', 'photos', 'videos', 'video_notes', 'voice_notes', 'polls', 'other_messages']
  .map((kind) => [`can_send_${kind}`, false]));

// Fails (logged) if the bot isn't admin, the user is, or the user isn't in the chat. Telegram lifts the
// mute at until_date; the minute cron then re-applies any per-user restrictions the mute overwrote.
const muteUser = (chatId: number, userId: number) => bot.getChatMember(chatId, userId)
  .then((member) => recordMute(chatId, userId, member, Date.now() + MUTE_SECONDS * 1000))
  .then(() => bot.restrictChatMember(chatId, userId, MUTED, Math.floor(Date.now() / 1000) + MUTE_SECONDS))
  .catch(console.error);

// Restores take effect up to a minute late (cron granularity)
export const runMuteRestores = async () => {
  for (const { restore, done } of await takeDueMuteRestores()) {
    // Original restriction already over: nothing to put back
    if (restore.untilDate && restore.untilDate * 1000 <= Date.now()) {
      await done();
      continue;
    }
    await bot.restrictChatMember(restore.chatId, restore.userId, restore.permissions, restore.untilDate)
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
  if (msg.chat.type !== 'private' && msg.from?.id && bannedKeywords.some(word => lowerText.includes(word))) {
    await muteUser(msg.chat.id, msg.from.id);
    return bot.sendMessage(msg.chat.id, bannedMessage, { reply_to_message_id: msg.message_id, message_thread_id: msg.message_thread_id });
  }
  // As admin the bot sees every group message; like privacy mode, only answer commands and replies to the bot
  const isForBot = msg.text.startsWith('/') || String(msg.reply_to_message?.from?.id) === botId;
  if (msg.chat.type !== 'private' && !isForBot) {
    return;
  }
  if (blockedUserIds.has(String(msg.from?.id))) {
    return bot.sendMessage(msg.chat.id, blockedMessage, { reply_to_message_id: msg.message_id, message_thread_id: msg.message_thread_id });
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
