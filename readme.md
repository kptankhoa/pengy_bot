# Chillax_bot
Chillax_bot: Telegram Chatbot using ChatGPT to generate responses

## Configuration
Provide the following configs in your .env file
```
BOT_NAME=<name for your bot>
BOT_TOKEN=<telegram chat bot token>
OPENAI_API_KEY=<open ai api key>
BING_IMAGE_COOKIE=<bing _U cookie to generate images>
OPENAI_MODEL=<chatgpt model, eg. gpt-3.5-turbo-0301>
OPENAI_DEFAULT_RESPONSE: <default chatbot response in case of error>
OPENAI_DEFAULT_MAX_TOKENS: 500
OPENAI_TEMPERATURE: 0.7
OPENAI_TOP_P: 1.0
OPENAI_FREQUENCY_PENALTY: 0.2
OPENAI_PRESENCE_PENALTY: 0.2
```

## Installation
```
npm install
npm start
```

## Usage:
`Find your bot on Telegram and chat with it using command given`