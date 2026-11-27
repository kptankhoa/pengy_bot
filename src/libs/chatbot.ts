import { STICKER_SET, blockedMessage, telegramToken } from "const/settings";
import { Message } from "models";
import { getMessageHandler } from "libs/message-handler";
import { BOT_COMMAND, NOTI_GROUP_ID, pepeStickerMap } from "const/chat";
import { Sticker } from "models/sticker";
import {
  checkChatIdExist,
  clearMuteRestore,
  ensureChatConfig,
  loadChatConfigs,
  recordMute,
  takeDueMuteRestores,
} from "libs/firebase";
import { getBannedKeywords, getGroupBlocklist, loadChatBots } from "services";
import { createBot } from "libs/telegram";
import { cached } from "utils/cache-util";
import {
  isBlocklistCommand,
  onBlocklistCallback,
  onBlocklistMessage,
} from "libs/message-handler/blocklist-message-handler";

const bot = createBot();
const MUTE_SECONDS = 5 * 60;
const MUTED = Object.fromEntries(
  ["messages", "audios", "documents", "photos", "videos", "video_notes", "voice_notes", "polls", "other_messages"].map(
    (kind) => [`can_send_${kind}`, false],
  ),
);
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
  can_manage_topics: false,
};

// Fails (logged) if the bot isn't admin, the user is, or the user isn't in the chat.
const muteUser = (chatId: number, userId: number) =>
  bot
    .getChatMember(chatId, userId)
    .then(() => recordMute(chatId, userId, Date.now() + MUTE_SECONDS * 1000))
    .then(() => bot.restrictChatMember(chatId, userId, MUTED, Math.floor(Date.now() / 1000) + MUTE_SECONDS))
    .then(() => true)
    .catch((error) => {
      console.error(error);
      return false;
    });

const getBlocklistName = (member: { name?: string; username?: string; userId: number }) =>
  member.name || (member.username ? `@${member.username}` : String(member.userId));

// Timed mutes expire into text-only permissions; the cron may apply them up to a minute late.
export const runMuteRestores = async () => {
  for (const { restore, done } of await takeDueMuteRestores()) {
    await bot.restrictChatMember(restore.chatId, restore.userId, TEXT_ONLY, 0).then(done).catch(console.error); // left in place, retried next minute
  }
};

// Bot tokens are "<bot id>:<secret>"
const botId = telegramToken.split(":")[0];

const loadStickers = cached(async () => {
  const res = await bot.getStickerSet(STICKER_SET);
  [...(res?.stickers || [])]
    .reverse()
    .forEach((sticker: Sticker) => pepeStickerMap.set(sticker.emoji, sticker.file_id));
}, 60 * 60_000);

const notifyNewChatId = async (msg: Message) => {
  const chatId = msg.chat.id;
  if (!(await checkChatIdExist(chatId))) {
    const newMsgNoti = "Mới có chat mới";
    const json = JSON.stringify(msg, null, 2);
    await bot.sendMessage(NOTI_GROUP_ID, `${newMsgNoti}\n${json}`, {
      entities: [{ offset: newMsgNoti.length + 1, length: json.length, type: "code" }],
    });
  }
};

const onTextMsg = (msg: Message) => {
  const messageHandler = getMessageHandler(bot);
  const chatText = msg.text;

  if (BOT_COMMAND.HELP.test(chatText)) {
    return messageHandler.onHelp(msg);
  }

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

  if (isBlocklistCommand(chatText)) {
    return onBlocklistMessage(bot, msg);
  }

  return messageHandler.onNewMessage(msg);
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
  if (callback?.data === "retry") {
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
  if (callback?.data?.startsWith("bl:")) {
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
  if (isBlocklistCommand(msg.text)) {
    if (msg.chat.type === "private") return onBlocklistMessage(bot, msg);
    try {
      const member = await bot.getChatMember(msg.chat.id, msg.from.id);
      if (!["administrator", "creator"].includes(member.status)) {
        return bot.sendMessage(msg.chat.id, "Chỉ admin nhóm mới được quản lý blocklist.", {
          reply_to_message_id: msg.message_id,
        });
      }
    } catch (error) {
      console.error(`Failed to verify blocklist admin in chat ${msg.chat.id}`, error);
      return bot.sendMessage(msg.chat.id, "Không xác minh được quyền admin. Vui lòng thử lại.", {
        reply_to_message_id: msg.message_id,
      });
    }
    return onBlocklistMessage(bot, msg);
  }
  const isBanCommand = BOT_COMMAND.BAN.test(msg.text);
  const isFreeCommand = BOT_COMMAND.FREE.test(msg.text);
  if (msg.chat.type !== "private" && (isBanCommand || isFreeCommand)) {
    try {
      const member = await bot.getChatMember(msg.chat.id, msg.from.id);
      if (!["administrator", "creator"].includes(member.status)) {
        return bot.sendMessage(msg.chat.id, "Chỉ admin nhóm mới được dùng lệnh này.", {
          reply_to_message_id: msg.message_id,
        });
      }
    } catch (error) {
      console.error(`Failed to verify moderation admin in chat ${msg.chat.id}`, error);
      return bot.sendMessage(msg.chat.id, "Không xác minh được quyền admin. Vui lòng thử lại.", {
        reply_to_message_id: msg.message_id,
      });
    }
    const groupBlockedUsers = await getGroupBlocklist(msg.chat.id);
    if (isBanCommand) {
      if (!groupBlockedUsers.length) {
        return bot.sendMessage(msg.chat.id, "Blocklist nhóm đang trống.", { message_thread_id: msg.message_thread_id });
      }
      const muteResults = await Promise.all(
        groupBlockedUsers.map(async (member) => ({ member, muted: await muteUser(msg.chat.id, member.userId) })),
      );
      const mutedMembers = muteResults.filter((result) => result.muted).map((result) => result.member);
      const names = mutedMembers.map(getBlocklistName).join(", ");
      return bot.sendMessage(
        msg.chat.id,
        names
          ? `Bạn đã khóa mõm ${names} 5p`
          : "Không thể hạn chế thành viên nào trong blocklist. Kiểm tra quyền hạn chế thành viên của bot nhé.",
        { message_thread_id: msg.message_thread_id },
      );
    }

    const results = await Promise.all(
      groupBlockedUsers.map(async (member) => {
        try {
          await bot.restrictChatMember(msg.chat.id, member.userId, TEXT_ONLY, 0);
          await clearMuteRestore(msg.chat.id, member.userId);
          return member;
        } catch (error) {
          console.error(`Failed to free blocklisted user ${member.userId} in chat ${msg.chat.id}`, error);
          return undefined;
        }
      }),
    );
    const freedMembers = results.filter((member): member is NonNullable<typeof member> => !!member);
    const names = freedMembers.map(getBlocklistName).join(", ");
    return bot.sendMessage(
      msg.chat.id,
      names ? `Bạn đã gỡ khóa mõm cho ${names}. Tiếp tục gáy đi đi nào!` : "Không có thành viên nào được gỡ hạn chế.",
      { message_thread_id: msg.message_thread_id },
    );
  }
  const lowerText = msg.text.toLowerCase();
  const groupBlockedUsers = msg.chat.type === "private" ? [] : await getGroupBlocklist(msg.chat.id);
  const isBlockedUser = groupBlockedUsers.some((member) => member.userId === msg.from?.id);
  const isBanWordCommand = BOT_COMMAND.BAN_WORD.test(msg.text);
  if (
    msg.chat.type !== "private" &&
    isBlockedUser &&
    msg.from?.id &&
    !isBanWordCommand &&
    (await getBannedKeywords()).some((word) => lowerText.includes(word))
  ) {
    const muted = await muteUser(msg.chat.id, msg.from.id);
    const blockedMember = groupBlockedUsers.find((member) => member.userId === msg.from.id);
    return bot.sendMessage(
      msg.chat.id,
      muted && blockedMember
        ? `Bạn đã khóa mõm ${getBlocklistName(blockedMember)} 5p`
        : "Không thể hạn chế thành viên này. Kiểm tra quyền hạn chế thành viên của bot nhé.",
      { reply_to_message_id: msg.message_id, message_thread_id: msg.message_thread_id },
    );
  }
  if (isBlockedUser && msg.text.startsWith("/")) {
    return bot.sendMessage(msg.chat.id, blockedMessage, {
      reply_to_message_id: msg.message_id,
      message_thread_id: msg.message_thread_id,
    });
  }
  if (isBlockedUser) return;

  const isForBot =
    msg.chat.type === "private" || msg.text.startsWith("/") || String(msg.reply_to_message?.from?.id) === botId;
  // As admin the bot sees every group message; like privacy mode, only answer commands and replies to the bot
  if (msg.chat.type !== "private" && !isForBot) {
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
  await onTextMsg(msg);
};
