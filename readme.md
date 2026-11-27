# Pengy_bot
Pengy_bot: Telegram Chatbot using ChatGPT to generate responses \
Created by: @kptankhoa \
Chat with Pengy on Telegram: https://t.me/pengy_bot

## Deploy (Cloudflare Workers)

The bot runs as a Worker driven by a Telegram webhook (no polling).

1. `npm install`
2. Put the env vars below in a JSON file (e.g. `secrets.json`, don't commit it) and run `npx wrangler secret bulk secrets.json`:
   `BOT_TOKEN`, `WEBHOOK_SECRET` (any random string), `BOT_NAME`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_DEFAULT_RESPONSE`, `OPENAI_DEFAULT_MAX_TOKENS`, `OPENAI_TEMPERATURE`, `OPENAI_TOP_P`, `OPENAI_PRESENCE_PENALTY`, `OPENAI_FREQUENCY_PENALTY`, `TAVILY_API_KEY`, `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, `FIREBASE_MEASUREMENT_ID`
3. `npm run deploy`, then register the webhook once:
   `curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" -d url=https://pengy-bot.<subdomain>.workers.dev -d secret_token=<WEBHOOK_SECRET>`

Local dev: copy the vars from `.env.example` into `.env` (gitignored), then run `npm run dev`.

Use `/s <query>` in Telegram to search the web and get a Vietnamese answer with source links. The `/c` chatbot can also choose web search when it needs current information. Configure `TAVILY_API_KEY` in `.env` locally and as a Wrangler secret in production. Tavily's free plan currently includes 1,000 API credits per month.

In a group, admins can manage that group's bot blocklist with `/blocklist`. Reply to a member's message with `/blocklist add` or use `/blocklist add <user_id>` to add them. The list has inline configuration and remove buttons; `/blocklist remove <user_id>` also works. Members on the list cannot interact with the bot in that group unless their settings allow it. `/ban` restricts every member currently on that group's blocklist for five minutes; `/free` lifts those restrictions. Each group's list is stored separately in Firestore.

Admins can press the gear button next to a blocklisted member to configure them separately: restrict them for five minutes when they use a banned keyword, and block their bot commands. Both settings are enabled by default, preserving existing behavior. Disable command blocking to let that member use chatbot commands while banned-keyword moderation remains enabled.
