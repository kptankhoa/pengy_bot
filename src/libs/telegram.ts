import { telegramToken } from 'const/settings';

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

// Same method names as node-telegram-bot-api so the message handlers stay unchanged.
export const createBot = () => ({
  sendMessage: (chat_id: number | string, text: string, options = {}) => call('sendMessage', { chat_id, text, ...options }),
  sendSticker: (chat_id: number, sticker: string, options = {}) => call('sendSticker', { chat_id, sticker, ...options }),
  sendChatAction: (chat_id: number, action: string) => call('sendChatAction', { chat_id, action }).catch(console.error),
  getStickerSet: (name: string) => call('getStickerSet', { name }),
  sendPhoto: (chat_id: number, photo: Uint8Array, options: Record<string, any> = {}) => {
    const form = new FormData();
    form.set('chat_id', String(chat_id));
    Object.entries(options).forEach(([key, value]) => form.set(key, String(value)));
    form.set('photo', new Blob([photo], { type: 'image/jpeg' }), 'image.jpg');
    return call('sendPhoto', form);
  }
});
