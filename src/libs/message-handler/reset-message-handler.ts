import { Message } from 'models';
import { BOT_COMMAND, botMessageIdMap, lastInteractionModeMap } from 'const/chat';
import { resetMap } from 'services';
import { resetChatHistory } from 'services/chat-history-service';

export const onResetMessage = async (bot: any, msg: Message) => {
  const chatId = msg.chat.id;
  const text = msg.text.replace(BOT_COMMAND.RESET, '').trim();
  const modes = text.split(' ');

  const exist: string[] = [];
  const notExist: string[] = [];

  const promises = modes.map(async (modeKey) => {
    const toBeResetMode = resetMap()[modeKey];
    if (!toBeResetMode) {
      notExist.push(modeKey);
      return;
    }
    await resetChatHistory(chatId, toBeResetMode);
    exist.push(toBeResetMode);
  });
  await Promise.all(promises);
  const resetModes = exist.join(', ');

  console.info(`\n\n--------reset: message_id: ${msg.message_id}, mode: ${resetModes}`);
  const res: Message = await bot.sendMessage(chatId, `Cleared chat history in: ${resetModes}\nNot available: ${notExist.join(', ')}`, { reply_to_message_id: msg.message_id });

  botMessageIdMap.set(res.message_id, 'no_reply');
  lastInteractionModeMap.set(chatId, 'no_reply');
};