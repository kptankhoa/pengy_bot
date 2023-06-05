import { Readability } from "@mozilla/readability";
import { RETRY_TIMES } from "../const/settings";
const got = require('got');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

export const getUrlContent = async (url: string) => {
    let retries = 0;
    while (retries < RETRY_TIMES) {
        try {
            const res = await got(url);
            const doc = new JSDOM(res.body).window.document;
            const article = new Readability(doc).parse();
            return article?.textContent;
        } catch(e) {
            console.log(e);
            retries++;
        }
    }
    return null;
}