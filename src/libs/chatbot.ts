import { STICKER_SET, blockedUserIds, blockedMessage, bannedKeywords, bannedMessage, telegramToken } from 'const/settings';
import { Message } from 'models';
import { getMessageHandler } from 'libs/message-handler';
import { BOT_COMMAND, NOTI_GROUP_ID, pepeStickerMap } from 'const/chat';
import { Sticker } from 'models/sticker';
import { checkChatIdExist, ensureChatConfig, loadChatConfigs } from 'libs/firebase';
import { loadChatBots } from 'services';
import { createBot } from 'libs/telegram';
import { cached } from 'utils/cache-util';

const bot = createBot();
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
    // Telegram lifts the restriction itself at until_date; fails if the bot isn't admin or the user is
    await bot.muteChatMember(msg.chat.id, msg.from.id, 5 * 60).catch(console.error);
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
