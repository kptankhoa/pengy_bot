import { handleUpdate } from 'libs/chatbot';
import { webhookSecret } from 'const/settings';
import { PRICE_ALERT_CHAT_ID, PRICE_ALERT_TOPIC_ID } from 'const/chat';
import { createBot } from 'libs/telegram';
import { getPriceMessage } from 'libs/message-handler/price-message-handler';

const bot = createBot();

export default {
  async fetch(request: Request, _env: unknown, ctx: ExecutionContext) {
    // Set via setWebhook's secret_token; an unset WEBHOOK_SECRET rejects everything.
    if (!webhookSecret || request.method !== 'POST' || request.headers.get('x-telegram-bot-api-secret-token') !== webhookSecret) {
      return new Response('forbidden', { status: 403 });
    }
    const update = await request.json<{ message?: any }>();
    // Ack immediately so Telegram doesn't retry while the LLM is thinking.
    ctx.waitUntil(handleUpdate(update).catch(console.error));
    return new Response('ok');
  },
  async scheduled(_controller: ScheduledController, _env: unknown, ctx: ExecutionContext) {
    ctx.waitUntil(getPriceMessage()
      .then((message) => bot.sendMessage(PRICE_ALERT_CHAT_ID, message, { message_thread_id: PRICE_ALERT_TOPIC_ID }))
      .catch((error) => console.error('Daily price notification failed', error)));
  }
};
