import { Readability } from "@mozilla/readability";
import { RETRY_TIMES } from "../const/settings";
const createBrowserless = require('browserless');
const getHTML = require('html-get');
const jsdom = require("jsdom");

const { JSDOM } = jsdom;
// Spawn Chromium process once
const browserlessFactory = createBrowserless()

// Kill the process when Node.js exit
process.on('exit', () => {
    console.log('closing resources!')
    browserlessFactory.close()
})

const getUrlHTML = async (url: string) => {
    let retries = 0;
    while (retries < RETRY_TIMES) {
        try {
            // create a browser context inside Chromium process
            const browserContext = browserlessFactory.createContext()
            const getBrowserless = () => browserContext
            const result = await getHTML(url, { getBrowserless })
            // close the browser context after it's used
            // @ts-ignore
            await getBrowserless((browser) => browser.destroyContext())
            return result
        } catch(e) {
            console.log('--- broserless error');
            console.log(e);
            retries++;
        }
    }
    return null;
}

export const getUrlContent = async (url: string) => {
    const content = await getUrlHTML(url);
    const doc = new JSDOM(content.html).window.document;
    const article = new Readability(doc).parse();
    return article?.textContent;
}