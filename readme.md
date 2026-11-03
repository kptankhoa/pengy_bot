# Pengy_bot
Pengy_bot: Telegram Chatbot using ChatGPT to generate responses \
Created by: @kptankhoa \
Chat with Pengy on Telegram: https://t.me/pengy_bot

## Deploy (Cloudflare Workers)

The bot runs as a Worker driven by a Telegram webhook (no polling).

1. `npm install`
2. Put the env vars below in a JSON file (e.g. `secrets.json`, don't commit it) and run `npx wrangler secret bulk secrets.json`:
   `BOT_TOKEN`, `WEBHOOK_SECRET` (any random string), `BOT_NAME`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_DEFAULT_RESPONSE`, `OPENAI_DEFAULT_MAX_TOKENS`, `OPENAI_TEMPERATURE`, `OPENAI_TOP_P`, `OPENAI_PRESENCE_PENALTY`, `OPENAI_FREQUENCY_PENALTY`, `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, `FIREBASE_MESUREMENT_ID`
3. `npm run deploy`, then register the webhook once:
   `curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" -d url=https://pengy-bot.<subdomain>.workers.dev -d secret_token=<WEBHOOK_SECRET>`

Local dev: copy the same vars into `.dev.vars`, run `npm run dev` (and `npm run types` after editing `wrangler.jsonc`).
