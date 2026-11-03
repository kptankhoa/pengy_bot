import { env } from 'cloudflare:workers';

export const generateImage = async (prompt: string): Promise<Uint8Array> => {
  if (!prompt) {
    throw new Error('Missing parameters');
  }
  const { image } = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', { prompt });
  if (!image) {
    throw new Error('No image returned');
  }
  return Uint8Array.from(atob(image), (c) => c.charCodeAt(0));
};
