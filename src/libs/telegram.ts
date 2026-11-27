import { telegramToken } from 'const/settings';
import { splitText } from 'utils/split-text';

const call = async (method: string, body: object | FormData) => {
  const isForm = body instanceof FormData;
  const res = await fetch(`https://api.telegram.org/bot${telegramToken}/${method}`, {
    method: 'POST',
    headers: isForm ? undefined : { 'content-type': 'application/json' },
    body: isForm ? body : JSON.stringify(body)
  });
  const json = await res.json<{ ok: boolean, result: any, description?: string }>();
  if (!json.ok) {
    throw new Error(`telegram ${method}: ${json.description}`);
  }
  return json.result;
};

// Telegram clears the typing indicator after ~5s, so resend until the reply goes out.
const typingTimers = new Map<number | string, ReturnType<typeof setInterval>>();

const stopTyping = (chat_id: number | string) => {
  clearInterval(typingTimers.get(chat_id));
  typingTimers.delete(chat_id);
};

const startTyping = (chat_id: number) => {
  stopTyping(chat_id);
  const send = () => call('sendChatAction', { chat_id, action: 'typing' }).catch(console.error);
  send();
  typingTimers.set(chat_id, setInterval(send, 4000));
  return () => stopTyping(chat_id);
};

const sendMessage = async (chat_id: number | string, text: string, options: Record<string, any> = {}) => {
  // Stop before sending: a typing request landing after the reply would show for another 5s
  stopTyping(chat_id);
  const [first, ...others] = splitText(text);
  let res = await call('sendMessage', { chat_id, text: first, ...options });
  // Only the first chunk replies to the user's message; callers get the last chunk's id
  const restOptions = { ...options, reply_to_message_id: undefined, entities: undefined };
  for (const chunk of others) {
    res = await call('sendMessage', { chat_id, text: chunk, ...restOptions });
  }
  return res;
};

// Same method names as node-telegram-bot-api so the message handlers stay unchanged.
export const createBot = () => ({
  sendMessage,
  sendSticker: (chat_id: number, sticker: string, options = {}) => (stopTyping(chat_id), call('sendSticker', { chat_id, sticker, ...options })),
  startTyping,
  answerCallbackQuery: (callback_query_id: string) => call('answerCallbackQuery', { callback_query_id }).catch(console.error),
  deleteMessage: (chat_id: number, message_id: number) => call('deleteMessage', { chat_id, message_id }).catch(console.error),
  getStickerSet: (name: string) => call('getStickerSet', { name }),
  getChatMember: (chat_id: number, user_id: number) => call('getChatMember', { chat_id, user_id }),
  restrictChatMember: (chat_id: number, user_id: number, permissions: Record<string, boolean>, until_date: number) =>
    call('restrictChatMember', { chat_id, user_id, permissions, until_date, use_independent_chat_permissions: true }),
  sendPhoto: (chat_id: number, photo: Uint8Array, options: Record<string, any> = {}) => {
    stopTyping(chat_id);
    const form = new FormData();
    form.set('chat_id', String(chat_id));
    Object.entries(options).forEach(([key, value]) => form.set(key, String(value)));
    form.set('photo', new Blob([photo], { type: 'image/jpeg' }), 'image.jpg');
    return call('sendPhoto', form);
  }
});
