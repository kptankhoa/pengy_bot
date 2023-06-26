import { URL_REGEX } from "../const/common";
import { ChatModeEnum } from "../const/characteristics";

export const isUrl = (str: string) => URL_REGEX.test(str);

export const getChatHistoryKey = (mode: ChatModeEnum, chatId: number) => `${mode}-${chatId}`;
