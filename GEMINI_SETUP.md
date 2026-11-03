# Switching Pengy to Gemini (free tier)

The bot talks to any OpenAI-compatible `/chat/completions` endpoint, so Gemini is just config. Env var names keep the `OPENAI_` prefix.

## 1. Get an API key
1. Open <https://aistudio.google.com/apikey> and sign in with a Google account.
2. **Create API key** (attach it to a new or existing project). No card is needed for the free tier.
3. Open <https://aistudio.google.com/rate-limit> and note the free-tier RPM / requests-per-day for the model you want. Limits are per project, per model, and change often; daily quota resets at midnight Pacific.

## 2. Pick a model
Choose a Flash / Flash-Lite model that shows a free tier on the rate-limit page (Pro models may be paid-only). Use the exact model ID from AI Studio, e.g. `gemini-2.5-flash` or whatever the current Flash ID is.

## 3. Set the env vars
| Var | Value |
|---|---|
| `OPENAI_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai` |
| `OPENAI_API_KEY` | your Gemini API key |
| `OPENAI_MODEL` | the model ID from step 2 |
| `OPENAI_PRESENCE_PENALTY`, `OPENAI_FREQUENCY_PENALTY` | leave **unset** (only sent when non-zero; Gemini's compat layer doesn't document them) |

**Production:** update the Worker secrets, then redeploy only if code changed:
```sh
echo '{"OPENAI_BASE_URL":"https://generativelanguage.googleapis.com/v1beta/openai","OPENAI_API_KEY":"<key>","OPENAI_MODEL":"<model>"}' > secrets.json
npx wrangler secret bulk secrets.json && rm secrets.json
npm run deploy
```
**Local:** put the same three lines in `.dev.vars`, then `npm run dev`.

## 4. Test
Message the bot. Check logs with `npx wrangler tail`. A failing call prints `status: <code>, <body>` and the bot replies with `OPENAI_DEFAULT_RESPONSE`.

## Troubleshooting
- **400 about an unknown field** (e.g. `name`): Gemini's compat layer is in beta. Tell me the error and I'll strip that field.
- **429**: free quota hit; wait for the reset or switch to a Flash-Lite model.
- **403 / API key invalid**: key not enabled for the project, or pasted with whitespace.
- **Empty or cut-off replies**: Gemini 2.5+ "thinking" tokens count against `max_tokens`. Raise `OPENAI_DEFAULT_MAX_TOKENS` or per-bot `tokens`.
- **Privacy**: on the free tier, Google may use prompts to improve its products. Don't route sensitive chats through it.
