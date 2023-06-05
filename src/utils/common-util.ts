import { URL_REGEX } from "../const/common";

export const isUrl = (str: string) => str.match(URL_REGEX);
