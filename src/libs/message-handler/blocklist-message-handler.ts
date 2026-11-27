import { Message } from 'models';
import { addGroupBlockedMember, getGroupBlocklist, removeGroupBlockedMember } from 'services';
import { BOT_COMMAND } from 'const/chat';

const memberLabel = (member: { userId: number; name?: string; username?: string }) =>
  `${member.name || (member.username ? `@${member.username}` : 'Thành viên')} (${member.userId})`;

const listOptions = (members: Awaited<ReturnType<typeof getGroupBlocklist>>) => ({
  inline_keyboard: [
    ...members.map(member => [{ text: `🗑 ${member.name || member.username || member.userId}`, callback_data: `bl:rm:${member.userId}` }]),
    [{ text: '➕ Thêm thành viên', callback_data: 'bl:add' }]
  ]
});

export const isBlocklistCommand = (text: string) => BOT_COMMAND.BLOCKLIST.test(text);

export const onBlocklistMessage = async (bot: any, msg: Message) => {
  if (msg.chat.type === 'private') {
    return bot.sendMessage(msg.chat.id, 'Lệnh này chỉ dùng trong nhóm.', { reply_to_message_id: msg.message_id });
  }

  const args = msg.text.replace(/^\/blocklist(?:@[\w_]+)?/i, '').trim().split(/\s+/).filter(Boolean);
  const action = args[0]?.toLowerCase();
  const targetId = action === 'add'
    ? Number(args[1] || msg.reply_to_message?.from?.id)
    : undefined;

  if (action === 'add') {
    if (!Number.isSafeInteger(targetId) || !targetId) {
      return bot.sendMessage(msg.chat.id, 'Cách dùng: trả lời tin nhắn thành viên bằng /blocklist add, hoặc dùng /blocklist add <user_id>.', { reply_to_message_id: msg.message_id });
    }
    const target = args[1] ? undefined : msg.reply_to_message?.from;
    const added = await addGroupBlockedMember(msg.chat.id, {
      userId: targetId,
      name: target?.first_name,
      username: target?.username
    });
    return bot.sendMessage(msg.chat.id, added ? `Đã thêm ${target?.first_name || target?.username || targetId} vào blocklist.` : 'Thành viên này đã có trong blocklist.', { reply_to_message_id: msg.message_id });
  }

  if (action === 'remove' || action === 'rm') {
    const userId = Number(args[1]);
    if (!Number.isSafeInteger(userId) || !userId) {
      return bot.sendMessage(msg.chat.id, 'Cách dùng: /blocklist remove <user_id>.', { reply_to_message_id: msg.message_id });
    }
    const removed = await removeGroupBlockedMember(msg.chat.id, userId);
    return bot.sendMessage(msg.chat.id, removed ? `Đã gỡ ${userId} khỏi blocklist.` : 'Không tìm thấy thành viên này trong blocklist.', { reply_to_message_id: msg.message_id });
  }

  const members = await getGroupBlocklist(msg.chat.id);
  const text = members.length
    ? `Blocklist nhóm (${members.length}):\n${members.map((member, index) => `${index + 1}. ${memberLabel(member)}`).join('\n')}\n\nChọn nút bên dưới để gỡ thành viên.`
    : 'Blocklist nhóm đang trống. Bấm nút để xem cách thêm thành viên.';
  return bot.sendMessage(msg.chat.id, text, {
    reply_to_message_id: msg.message_id,
    reply_markup: listOptions(members)
  });
};

export const onBlocklistCallback = async (bot: any, callback: {
  id: string;
  data?: string;
  from?: { id: number };
  message?: { message_id: number; chat: { id: number; type?: string } };
}) => {
  const chatId = callback.message?.chat.id;
  if (!chatId || !callback.from?.id) {
    return bot.answerCallbackQuery(callback.id, { text: 'Không thể xác định nhóm hoặc tài khoản.', show_alert: true });
  }

  let member: any;
  try {
    member = await bot.getChatMember(chatId, callback.from.id);
  } catch {
    return bot.answerCallbackQuery(callback.id, { text: 'Không thể xác minh quyền admin.', show_alert: true });
  }
  if (!['administrator', 'creator'].includes(member.status)) {
    return bot.answerCallbackQuery(callback.id, { text: 'Chỉ admin nhóm mới dùng được blocklist.', show_alert: true });
  }

  const data = callback.data || '';
  if (data === 'bl:add') {
    await bot.answerCallbackQuery(callback.id);
    return bot.editMessageText(chatId, callback.message!.message_id,
      'Để thêm thành viên: trả lời tin nhắn của họ bằng /blocklist add, hoặc gửi /blocklist add <user_id>.',
      { reply_markup: { inline_keyboard: [[{ text: '⬅️ Xem blocklist', callback_data: 'bl:list' }]] } });
  }

  if (data === 'bl:list') {
    const members = await getGroupBlocklist(chatId);
    const text = members.length
      ? `Blocklist nhóm (${members.length}):\n${members.map((item, index) => `${index + 1}. ${memberLabel(item)}`).join('\n')}\n\nChọn nút bên dưới để gỡ thành viên.`
      : 'Blocklist nhóm đang trống. Bấm nút để xem cách thêm thành viên.';
    await bot.answerCallbackQuery(callback.id);
    return bot.editMessageText(chatId, callback.message!.message_id, text, { reply_markup: listOptions(members) });
  }

  const match = data.match(/^bl:rm:(\d+)$/);
  if (!match) return bot.answerCallbackQuery(callback.id, { text: 'Nút không hợp lệ.', show_alert: true });
  const userId = Number(match[1]);
  const removed = await removeGroupBlockedMember(chatId, userId);
  const members = await getGroupBlocklist(chatId);
  const text = members.length
    ? `Blocklist nhóm (${members.length}):\n${members.map((item, index) => `${index + 1}. ${memberLabel(item)}`).join('\n')}\n\nChọn nút bên dưới để gỡ thành viên.`
    : 'Blocklist nhóm đang trống. Bấm nút để xem cách thêm thành viên.';
  await bot.answerCallbackQuery(callback.id, { text: removed ? 'Đã gỡ thành viên.' : 'Thành viên đã được gỡ trước đó.' });
  return bot.editMessageText(chatId, callback.message!.message_id, text, { reply_markup: listOptions(members) });
};
