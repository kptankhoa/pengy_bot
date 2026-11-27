import { chatModes, getChatBot } from 'services';
import { Message } from 'models';

// BotFather /setcommands only accepts lowercase letters, digits and underscores, max 32 chars
const BOTFATHER_COMMAND = /^[a-z0-9_]{1,32}$/;

// Paste the reply into BotFather's /setcommands as-is: "command - description", one per line
const getCommandsMessage = () => {
  const modeCommands = chatModes()
    .map(({ mode }) => {
      const chatBot = getChatBot(mode);
      return BOTFATHER_COMMAND.test(chatBot.key || '') ? `${chatBot.key} - Trò chuyện với ${chatBot.name || mode}` : '';
    })
    .filter(Boolean);

  return [
    'help - Xem danh sách lệnh',
    'i - Tạo ảnh',
    'b - Xem thời tiết',
    'n - Hỏi về tin tức hoặc đọc bài viết',
    's - Tìm kiếm web',
    'pr - Xem giá vàng, ngoại tệ, xăng dầu và lãi suất',
    'ci - Xem thông tin nhóm và topic',
    'z - Xóa lịch sử trò chuyện',
    ...modeCommands,
    'dict - Quản lý từ điển',
    'fund - Xem và cập nhật quỹ',
    'note - Xem, thêm hoặc xóa ghi chú',
    'banword - Quản lý từ khóa bị cấm',
    'blocklist - Quản lý danh sách chặn (chỉ admin)',
    'ban - Hạn chế 5 phút thành viên trong blocklist (chỉ admin)',
    'free - Gỡ hạn chế thành viên trong blocklist (chỉ admin)',
  ].join('\n');
};

export const onCommandsMessage = (bot: any, msg: Message) =>
  bot.sendMessage(msg.chat.id, getCommandsMessage(), { reply_to_message_id: msg.message_id });
