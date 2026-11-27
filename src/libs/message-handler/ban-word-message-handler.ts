import { BOT_COMMAND } from 'const/chat';
import { Message } from 'models';
import { addBannedKeyword, getBannedKeywords, removeBannedKeyword } from 'services';

const getReply = async (text: string): Promise<string> => {
  const args = text.replace(BOT_COMMAND.BAN_WORD, '').trim();
  const [command, ...rest] = args.split(/\s+/);
  const keyword = rest.join(' ').trim();

  if (!command || command === 'list') {
    const keywords = await getBannedKeywords();
    return keywords.length ? `Từ khóa đang bị cấm: ${keywords.join(', ')}` : 'Chưa có từ khóa nào bị cấm.';
  }

  if (command === 'add') {
    if (!keyword) return 'Cách dùng: /banword add <từ khóa>';
    return await addBannedKeyword(keyword)
      ? `Đã thêm từ khóa: ${keyword.toLowerCase()}`
      : `Từ khóa đã có: ${keyword.toLowerCase()}`;
  }

  if (command === 'remove' || command === 'rm') {
    if (!keyword) return 'Cách dùng: /banword remove <từ khóa>';
    return await removeBannedKeyword(keyword)
      ? `Đã gỡ từ khóa: ${keyword.toLowerCase()}`
      : `Không tìm thấy từ khóa: ${keyword.toLowerCase()}`;
  }

  return 'Cách dùng: /banword add <từ khóa> | /banword remove <từ khóa> | /banword list';
};

export const onBanWordMessage = async (bot: any, msg: Message) => {
  const reply = await getReply(msg.text);
  await bot.sendMessage(msg.chat.id, reply, { reply_to_message_id: msg.message_id, message_thread_id: msg.message_thread_id });
};
