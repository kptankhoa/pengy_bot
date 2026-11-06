import {
  apiKey,
  baseUrl,
  completeRequestConfig,
  defaultMaxTokens,
  defaultMessage,
  MESSAGE_LIMIT,
  RETRY_TIMES
} from 'const/settings';
import { getChatBot } from 'services';
import { searchWeb } from './web-search-service';
import { getMessagesByTokens, getName, getUsedTokens } from 'utils';
import { ChatMessage, RoleEnum } from 'models';
import { getWebSearchToolPrompt } from 'const/prompts';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Workers cancel waitUntil work 30s after the response, so the LLM step must finish well inside that.
const ATTEMPT_TIMEOUT_MS = 18_000;
const LLM_BUDGET_MS = 22_000;
const TOOL_FLOW_BUDGET_MS = 25_000;
const TOOL_DECISION_BUDGET_MS = 7000;

class NonRetryableError extends Error {}

interface CompletionMessage {
  role: 'assistant';
  content: string | null;
  tool_calls?: {
    id: string;
    type: string;
    function: { name: string; arguments: string };
  }[];
}

const getReplyMessage = async (
  request: object,
  estimatedTokens: number,
  started = Date.now(),
  budgetMs = LLM_BUDGET_MS
): Promise<CompletionMessage> => {
  let retries = 0;
  while (retries < RETRY_TIMES) {
    try {
      const remaining = budgetMs - (Date.now() - started);
      if (remaining <= 0) {
        break;
      }
      const res = await fetch(`${baseUrl}/chat/completions`, {
        signal: AbortSignal.timeout(Math.min(ATTEMPT_TIMEOUT_MS, remaining)),
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(request)
      });
      if (!res.ok) {
        const message = `status: ${res.status}, ${await res.text()}`;
        // 4xx other than rate limiting won't change on retry
        throw res.status >= 400 && res.status < 500 && res.status !== 429 ? new NonRetryableError(message) : new Error(message);
      }
      const completion = await res.json<{ choices: { message?: CompletionMessage }[], usage?: { prompt_tokens: number } }>();
      // compare with getUsedTokens' chars/3 guess to tune it
      console.log(`llm ${Date.now() - started}ms, prompt tokens: estimated ${estimatedTokens}, actual ${completion.usage?.prompt_tokens}`);
      return completion.choices[0].message || { role: 'assistant', content: defaultMessage };
    } catch (error: any) {
      console.error('-----error, retries time: ' + retries);
      console.error('error message: ' + error.message);
      if (error instanceof NonRetryableError) {
        break;
      }
      retries++;
      if (Date.now() - started + 500 * 2 ** retries >= budgetMs) {
        break;
      }
      await sleep(500 * 2 ** retries);
    }
  }
  return { role: 'assistant', content: defaultMessage };
};

const searchTool = {
  type: 'function',
  function: {
    name: 'search_web',
    description: 'Search the live web for current information and return a few source links and snippets.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'A concise web search query.' }
      },
      required: ['query'],
      additionalProperties: false
    }
  }
};

const runSearchTool = async (argumentsText: string): Promise<string> => {
  try {
    const args = JSON.parse(argumentsText) as { query?: unknown };
    const query = typeof args.query === 'string' ? args.query.trim().slice(0, 250) : '';
    if (!query) {
      return JSON.stringify({ error: 'A non-empty search query is required.' });
    }
    return JSON.stringify({ results: await searchWeb(query) });
  } catch {
    return JSON.stringify({ error: 'The search request could not be completed.' });
  }
};

export const handleMessageRequest = async (chatHistory: ChatMessage[], chatMode: string, extraPrompt = '') => {
  const { postfix, systemGuide, tokens } = getChatBot(chatMode);
  const maxTokens = tokens || defaultMaxTokens;
  const canSearchWeb = getChatBot(chatMode).key === 'c' || chatMode === 'search';
  const guide = systemGuide.concat(extraPrompt, canSearchWeb ? getWebSearchToolPrompt() : '');
  const shortenHistory = [...chatHistory]
    .splice(chatHistory.length - MESSAGE_LIMIT)
    .map((msg: ChatMessage) => {
      const name = getName(msg.name || '');
      // Gemini's OpenAI-compat layer ignores `name`, so also put the speaker in the text
      return { ...msg, name, content: msg.role === RoleEnum.USER && name ? `${name}: ${msg.content}` : msg.content };
    });
  const messages = getMessagesByTokens(shortenHistory, maxTokens, guide, postfix);
  console.log('------input------');
  [messages[0], messages[messages.length - 1]].map((msg) => console.log(`${msg.name || msg.role}: ${msg.content}`));

  const request: Record<string, unknown> = {
    messages,
    max_tokens: maxTokens,
    ...completeRequestConfig
  };
  if (!canSearchWeb) {
    return (await getReplyMessage(request, getUsedTokens(messages, 0))).content || defaultMessage;
  }

  request.tools = [searchTool];
  request.tool_choice = chatMode === 'search' ? 'required' : 'auto';
  const toolFlowStarted = Date.now();
  const firstResponse = await getReplyMessage(request, getUsedTokens(messages, 0), toolFlowStarted, TOOL_DECISION_BUDGET_MS);
  const toolCalls = (firstResponse.tool_calls || []).filter((toolCall) =>
    toolCall && typeof toolCall.function?.name === 'string' && typeof toolCall.function.arguments === 'string'
  );
  if (!toolCalls.length) {
    return firstResponse.content || defaultMessage;
  }

  const normalizedToolCalls = toolCalls.map((toolCall, index) => ({
    ...toolCall,
    id: toolCall.id || `web-search-${toolFlowStarted}-${index}`
  }));
  const assistantToolResponse = { ...firstResponse, tool_calls: normalizedToolCalls };

  const toolMessages = await Promise.all(normalizedToolCalls.map(async (toolCall, index) => ({
    role: 'tool',
    tool_call_id: toolCall.id,
    name: toolCall.function.name,
    content: index === 0 && toolCall.function.name === 'search_web'
      ? await runSearchTool(toolCall.function.arguments)
      : JSON.stringify({ error: 'Only one web search can be run per message.' })
  })));
  const finalMessages = [
    ...messages,
    assistantToolResponse,
    ...toolMessages
  ];
  const finalResponse = await getReplyMessage({
    ...request,
    messages: finalMessages,
    tools: undefined,
    tool_choice: undefined
  }, getUsedTokens(finalMessages as ChatMessage[], 0), toolFlowStarted, TOOL_FLOW_BUDGET_MS);
  return finalResponse.content || defaultMessage;
};
