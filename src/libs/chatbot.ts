import { STICKER_SET, telegramToken } from 'const/settings';
import { Message } from 'models';
import { handleTextMessage } from 'libs/message-handler';
import { NOTI_GROUP_ID, pepeStickerMap } from 'const/chat';
import { Sticker } from 'models/sticker';
import {
  checkChatIdExist,
  ensureChatConfig,
  loadChatConfigs,
} from 'libs/firebase';
import { getGroupBlocklist, loadChatBots } from 'services';
import { createBot } from 'libs/telegram';
import { cached } from 'utils/cache-util';
import {
  handleBlockedUserMessage,
  handleModerationCommand,
  runMuteRestores,
} from 'libs/chatbot/moderation-handler';
import { onBlocklistCallback } from 'libs/message-handler/blocklist-message-handler';

const bot = createBot();
export { runMuteRestores };

// Bot tokens are "<bot id>:<secret>"
const botId = telegramToken.split(':')[0];

const loadStickers = cached(async () => {
  const res = await bot.getStickerSet(STICKER_SET);
  [...(res?.stickers || [])]
    .reverse()
    .forEach((sticker: Sticker) => pepeStickerMap.set(sticker.emoji, sticker.file_id));
}, 60 * 60_000);

const notifyNewChatId = async (msg: Message) => {
  const chatId = msg.chat.id;
  if (!(await checkChatIdExist(chatId))) {
    const newMsgNoti = 'Mới có chat mới';
    const json = JSON.stringify(msg, null, 2);
    await bot.sendMessage(NOTI_GROUP_ID, `${newMsgNoti}\n${json}`, {
      entities: [{ offset: newMsgNoti.length + 1, length: json.length, type: 'code' }],
    });
  }
};

interface CallbackQuery {
  id: string;
  data?: string;
  from?: { id: number };
  message?: { message_id: number; chat: { id: number; type?: string }; reply_to_message?: Message };
}

// Per-isolate guard against double taps on the same retry button
const retrying = new Set<number>();

export const handleUpdate = async (update: { message?: Message; callback_query?: CallbackQuery }) => {
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
  if (callback?.data?.startsWith('bl:')) {
    return onBlocklistCallback(bot, callback);
  }
  if (update.message?.text) {
    return run(update.message);
  }
};

const run = async (msg: Message) => {
  console.log(
    `user ${msg.from?.id} (@${msg.from?.username || msg.from?.first_name}) in ${msg.chat.type} ${msg.chat.id}`,
  );
  if (await handleModerationCommand(msg)) return;
  const groupBlockedUsers = msg.chat.type === 'private' ? [] : await getGroupBlocklist(msg.chat.id);
  if (await handleBlockedUserMessage(msg, groupBlockedUsers)) return;

  const isForBot =
    msg.chat.type === 'private' || msg.text.startsWith('/') || String(msg.reply_to_message?.from?.id) === botId;
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
  await Promise.all([
    loadChatBots(),
    loadChatConfigs(),
    loadStickers().catch(console.error),
    notifyNewChatId(msg).catch(console.error),
  ]);
  await ensureChatConfig(msg.chat.id);
  await handleTextMessage(bot, msg);
};
