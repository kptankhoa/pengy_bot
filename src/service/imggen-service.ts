import { RETRY_TIMES } from "../const/settings/settings";
import { generateImagesLinks } from "../lib/bimg/imgen";

export const handleImageRequest = async (prompt: string): Promise<string[] | null> => {
    let retries = 0;
    while (retries < RETRY_TIMES) {
        try {
            const res = await generateImagesLinks(prompt);
            return res;
        } catch (error: any) {
            console.log(error)
            retries++;
        }
    }
    return null;
}