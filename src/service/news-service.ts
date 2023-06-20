import { Readability } from "@mozilla/readability";
import { RETRY_TIMES } from "../const/settings";
import axios from "axios";
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

export const getUrlContent = async (url: string) => {
    let retries = 0;
    while (retries < RETRY_TIMES) {
        try {
            const res = await axios.get(url);
            const doc = new JSDOM(res.data).window.document;
            const article = new Readability(doc).parse();
            return article?.textContent;
        } catch(e) {
            console.error('-----ERROR: news url error ----, retries:' + retries);
            retries++;
        }
    }
    return null;
}