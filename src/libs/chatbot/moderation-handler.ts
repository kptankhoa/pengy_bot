import { BOT_COMMAND } from 'const/chat';
import { blockedMessage } from 'const/settings';
import { Message, MessageType } from 'models';
import {
  clearMuteRestore,
  recordMute,
  takeDueMuteRestores,
} from 'libs/firebase';
import { getBannedKeywords, getGroupBlocklist } from 'services';
import { createBot } from 'libs/telegram';
import {
  isBlocklistCommand,
  onBlocklistMessage,
} from 'libs/message-handler/blocklist-message-handler';

const bot = createBot();
const MUTE_SECONDS = 5 * 60;
const MUTED = Object.fromEntries(
  ['messages', 'audios', 'documents', 'photos', 'videos', 'video_notes', 'voice_notes', 'polls', 'other_messages'].map(
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

const getBlocklistName = (member: { name?: string; username?: string; userId: number }) =>
  member.name || (member.username ? `@${member.username}` : String(member.userId));

const muteUser = (chatId: number, userId: number) =>
  bot
    .getChatMember(chatId, userId)
    .then(() => recordMute(chatId, userId, Date.now() + MUTE_SECONDS * 1000))
    // Keep the mute active until the scheduled restore applies TEXT_ONLY, matching /free.
    .then(() => bot.restrictChatMember(chatId, userId, MUTED, 0))
    .then(() => true)
    .catch((error) => {
      console.error(error);
      return false;
    });

const verifyAdmin = async (msg: Message, purpose: 'blocklist' | 'moderation') => {
  try {
    const member = await bot.getChatMember(msg.chat.id, msg.from.id);
    if (['administrator', 'creator'].includes(member.status)) return true;

    const text = purpose === 'blocklist'
      ? 'Chỉ admin nhóm mới được quản lý blocklist.'
      : 'Chỉ admin nhóm mới được dùng lệnh này.';
    await bot.sendMessage(msg.chat.id, text, { reply_to_message_id: msg.message_id });
  } catch (error) {
    console.error(`Failed to verify ${purpose} admin in chat ${msg.chat.id}`, error);
    await bot.sendMessage(msg.chat.id, 'Không xác minh được quyền admin. Vui lòng thử lại.', {
      reply_to_message_id: msg.message_id,
    });
  }
  return false;
};

const muteBlocklistedUsers = async (msg: Message) => {
  const members = await getGroupBlocklist(msg.chat.id);
  if (!members.length) {
    return bot.sendMessage(msg.chat.id, 'Blocklist nhóm đang trống.', { message_thread_id: msg.message_thread_id });
  }

  const results = await Promise.all(
    members.map(async (member) => ({ member, muted: await muteUser(msg.chat.id, member.userId) })),
  );
  const names = results.filter((result) => result.muted).map(({ member }) => getBlocklistName(member)).join(', ');
  return bot.sendMessage(
    msg.chat.id,
    names
      ? `Bạn đã khóa mõm ${names} 5p`
      : 'Không thể hạn chế thành viên nào trong blocklist. Kiểm tra quyền hạn chế thành viên của bot nhé.',
    { message_thread_id: msg.message_thread_id },
  );
};

const freeBlocklistedUsers = async (msg: Message) => {
  const members = await getGroupBlocklist(msg.chat.id);
  const results = await Promise.all(
    members.map(async (member) => {
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
  const names = results.filter((member): member is NonNullable<typeof member> => !!member)
    .map(getBlocklistName)
    .join(', ');
  return bot.sendMessage(
    msg.chat.id,
    names ? `Bạn đã gỡ khóa mõm cho ${names}. Tiếp tục gáy đi đi nào!` : 'Không có thành viên nào được gỡ hạn chế.',
    { message_thread_id: msg.message_thread_id },
  );
};

export const handleModerationCommand = async (msg: Message) => {
  if (isBlocklistCommand(msg.text)) {
    if (msg.chat.type === MessageType.PRIVATE) {
      await onBlocklistMessage(bot, msg);
      return true;
    }
    if (!(await verifyAdmin(msg, 'blocklist'))) return true;
    await onBlocklistMessage(bot, msg);
    return true;
  }

  const isBan = BOT_COMMAND.BAN.test(msg.text);
  const isFree = BOT_COMMAND.FREE.test(msg.text);
  if (msg.chat.type === MessageType.PRIVATE || (!isBan && !isFree)) return false;
  if (!(await verifyAdmin(msg, 'moderation'))) return true;

  if (isBan) await muteBlocklistedUsers(msg);
  else await freeBlocklistedUsers(msg);
  return true;
};

export const handleBlockedUserMessage = async (
  msg: Message,
  members: Awaited<ReturnType<typeof getGroupBlocklist>>,
) => {
  const member = members.find(({ userId }) => userId === msg.from?.id);
  if (!member) return false;

  const isBanWordCommand = BOT_COMMAND.BAN_WORD.test(msg.text);
  if (msg.chat.type !== MessageType.PRIVATE && !isBanWordCommand && member.banOnBannedKeyword !== false) {
    const containsBannedKeyword = (await getBannedKeywords())
      .some((word) => msg.text.toLowerCase().includes(word));
    if (containsBannedKeyword) {
      const muted = await muteUser(msg.chat.id, msg.from.id);
      await bot.sendMessage(
        msg.chat.id,
        muted
          ? `Bạn đã khóa mõm ${getBlocklistName(member)} 5p`
          : 'Không thể hạn chế thành viên này. Kiểm tra quyền hạn chế thành viên của bot nhé.',
        { reply_to_message_id: msg.message_id, message_thread_id: msg.message_thread_id },
      );
      return true;
    }
  }

  if (member.blockCommands !== false && msg.text.startsWith('/')) {
    await bot.sendMessage(msg.chat.id, blockedMessage, {
      reply_to_message_id: msg.message_id,
      message_thread_id: msg.message_thread_id,
    });
    return true;
  }
  return member.blockCommands !== false;
};

// Timed mutes stay active until the cron applies the same text-only permissions as /free.
export const runMuteRestores = async () => {
  for (const { restore, done } of await takeDueMuteRestores()) {
    await bot.restrictChatMember(restore.chatId, restore.userId, TEXT_ONLY, 0).then(done).catch(console.error);
  }
};
