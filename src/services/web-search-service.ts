import { webSearchApiKey } from 'const/settings';

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

const SEARCH_ENDPOINT = 'https://api.mwmbl.org/api/v2/search/';
const RESULT_LIMIT = 5;
const REQUEST_TIMEOUT_MS = 3000;

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

  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.set('q', normalizedQuery);

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const apiKey = webSearchApiKey.trim();
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    const response = await fetch(url, { headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) {
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
        snippet: toBoundedText(result.content ?? result.extract ?? result.description, 500)
      }))
      .filter((result) => result.title && result.url)
      .slice(0, RESULT_LIMIT);
  } catch {
    console.error('Web search request failed');
    return [];
  }
};
