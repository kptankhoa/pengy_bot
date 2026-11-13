import { BOT_COMMAND } from 'const/chat';
import { Message } from 'models';

export const onChatInfoMessage = async (bot: any, msg: Message) => {
  if (!BOT_COMMAND.CHAT_INFO.test(msg.text)) {
    return;
  }

  const { chat } = msg;
  const lines = [
    `Chat: ${chat.title || chat.username || 'Private chat'}`,
    `Chat ID: ${chat.id}`,
    `Type: ${chat.type}`
  ];

  if (chat.username) {
    lines.push(`Username: @${chat.username}`);
  }

  if (msg.message_thread_id !== undefined) {
    lines.push(`Topic ID (message_thread_id): ${msg.message_thread_id}`);
  } else {
    lines.push('Topic ID: not in a topic (send /ci inside the target topic)');
  }

  await bot.sendMessage(chat.id, lines.join('\n'), { reply_to_message_id: msg.message_id });
};
