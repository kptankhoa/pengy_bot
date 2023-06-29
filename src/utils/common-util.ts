import { URL_REGEX } from 'const/common';

export const isUrl = (str: string) => URL_REGEX.test(str);

export const getChatHistoryKey = (chatId: number, mode: string) => `${chatId}_${mode}`;
