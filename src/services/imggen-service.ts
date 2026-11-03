import { RETRY_TIMES } from 'const/settings';
import { generateImage } from 'libs/img-gen';

export const handleImageRequest = async (prompt: string): Promise<Uint8Array | null> => {
  let retries = 0;
  while (retries < RETRY_TIMES) {
    try {
      return await generateImage(prompt);
    } catch (error: any) {
      console.log(error);
      retries++;
    }
  }
  return null;
};
