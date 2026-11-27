import { chatModes, getChatBot } from 'services';
import { Message } from 'models';

const getHelpMessage = () => {
  const modeCommands = chatModes()
    .map(({ mode }) => {
      const chatBot = getChatBot(mode);
      return chatBot.key ? `/${chatBot.key} <câu hỏi> — trò chuyện với ${chatBot.name || mode}` : '';
    })
    .filter(Boolean);

  const lines = [
    '📖 Các lệnh của Pengy',
    '',
    '🤖 Trò chuyện & tiện ích',
    'Gửi tin nhắn hoặc trả lời Pengy để trò chuyện.',
    '/help — xem danh sách lệnh này',
    '/i <mô tả> — tạo ảnh',
    '/b <địa điểm> — xem thời tiết',
    '/n <câu hỏi hoặc URL> — hỏi về tin tức hoặc đọc bài viết',
    '/s <câu hỏi> — tìm kiếm web',
    '/pr — xem giá vàng, ngoại tệ, xăng dầu và lãi suất',
    '/ci — xem thông tin nhóm và topic',
    '/z <mode...> — xóa lịch sử trò chuyện của các mode đã chọn',
    ...(modeCommands.length ? ['', '💬 Các mode trò chuyện', ...modeCommands] : []),
    '',
    '📚 Từ điển, quỹ, ghi chú',
    '/dict [all|set|update|get|delete|help] — quản lý từ điển; ví dụ /dict set từ:loại:nghĩa:từ_đồng_nghĩa',
    '/fund [all|get|update|log|help] — xem và cập nhật quỹ; ví dụ /fund update tên_quỹ:số_dư:ghi_chú',
    '/note [all|add|delete|help] — xem, thêm hoặc xóa ghi chú; có thể dùng /note <yêu cầu> để nhờ Pengy ghi chú',
    '',
    '🛡️ Quản lý nhóm',
    '/banword [add|remove|list] — quản lý từ khóa bị cấm',
    '/blocklist — xem danh sách chặn và các nút gỡ thành viên (chỉ admin)',
    '/blocklist add <user_id> — thêm thành viên; hoặc trả lời tin nhắn của họ bằng /blocklist add (chỉ admin)',
    '/blocklist remove <user_id> — gỡ thành viên khỏi danh sách (chỉ admin)',
    '/ban — hạn chế 5 phút các thành viên trong blocklist (chỉ admin)',
    '/free — gỡ hạn chế cho thành viên trong blocklist (chỉ admin)',
  ];

  return lines.join('\n');
};

export const onHelpMessage = (bot: any, msg: Message) =>
  bot.sendMessage(msg.chat.id, getHelpMessage(), { reply_to_message_id: msg.message_id });
