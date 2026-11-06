import { tavilyApiKey } from 'const/settings';

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

const SEARCH_ENDPOINT = 'https://api.tavily.com/search';
const RESULT_LIMIT = 5;
const REQUEST_TIMEOUT_MS = 5000;

const toBoundedText = (value: unknown, maxLength: number): string =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const isHttpUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const searchWeb = async (query: string): Promise<WebSearchResult[]> => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [];
  }

  const apiKey = tavilyApiKey.trim();
  if (!apiKey) {
    console.error('Tavily API key is not configured');
    return [];
  }

  try {
    const response = await fetch(SEARCH_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: normalizedQuery,
        search_depth: 'basic',
        max_results: RESULT_LIMIT,
        chunks_per_source: 2,
        include_answer: false,
        include_raw_content: false
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    if (!response.ok) {
      console.error('Tavily search request failed', response.status);
      return [];
    }

    const payload = await response.json() as { results?: unknown };
    if (!Array.isArray(payload.results)) {
      return [];
    }

    return payload.results
      .filter((result): result is Record<string, unknown> => Boolean(result) && typeof result === 'object')
      .map((result) => ({
        title: toBoundedText(result.title, 160),
        url: isHttpUrl(result.url) ? result.url : '',
        snippet: toBoundedText(result.content, 700)
      }))
      .filter((result) => result.title && result.url)
      .slice(0, RESULT_LIMIT);
  } catch {
    console.error('Web search request failed');
    return [];
  }
};
