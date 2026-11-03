export const MAX_LENGTH = 4096;

// Splits at newlines/spaces where possible so chunks stay under Telegram's message limit.
export const splitText = (text: string, max = MAX_LENGTH): string[] => {
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > max) {
    const cut = Math.max(rest.lastIndexOf('\n', max), rest.lastIndexOf(' ', max));
    const at = cut > 0 ? cut : max;
    chunks.push(rest.slice(0, at));
    rest = rest.slice(at).trimStart();
  }
  return [...chunks, rest];
};
