import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import { RETRY_TIMES } from 'const/settings';

export const getUrlContent = async (url: string) => {
  let retries = 0;
  while (retries < RETRY_TIMES) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`status: ${res.status}`);
      }
      const { document } = parseHTML(await res.text());
      const article = new Readability(document as any).parse();
      return article?.textContent;
    } catch(e) {
      console.error('-----ERROR: news url error ----, retries:' + retries);
      retries++;
    }
  }
  return null;
};
