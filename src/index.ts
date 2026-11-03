import { handleUpdate } from 'libs/chatbot';
import { webhookSecret } from 'const/settings';

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
  }
};
