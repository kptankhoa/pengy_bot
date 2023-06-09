import axios, { AxiosInstance } from "axios";
import querystring from "querystring";
import { performance } from "perf_hooks";
import { bingImageCookie } from "../../const/chatbot-config.const";

const BING_URL = "https://www.bing.com";

const createSession = (authCookie: string) => {
    const session = axios.create({
        headers: {
            referrer: "https://www.bing.com/images/create/",
            origin: BING_URL,
            cookie: `_U=${authCookie}`,
        },
    });

    return session;
};

const getImages = async (session: AxiosInstance, prompt: string) => {
    console.log("Sending request...");
    const urlEncodedPrompt = querystring.escape(prompt);

    const url = `${BING_URL}/images/create?q=${urlEncodedPrompt}&rt=3&FORM=GENCRE`; // force use rt=3
    const response = await session.post(url, {
        maxRedirects: 0,
        validateStatus: function (status: number) {
            return status >= 200 && status < 303;
        },
        timeout: 200000,
    });

    let redirectUrl;
    if (response.status == 200) {
        redirectUrl = response.request.res.responseUrl.replace("&nfy=1", "");
    } else if (response.status !== 302) {
        console.error(
            `ERROR: the status is ${response.status} instead of 302 or 200`
        );
        throw new Error("Redirect failed");
    }
    const requestId = redirectUrl.split("id=")[1];
    await session.get(redirectUrl);

    const pollingUrl = `${BING_URL}/images/create/async/results/${requestId}?q=${urlEncodedPrompt}`;

    console.log("Waiting for results...");
    const startWait = performance.now();
    let imagesResponse;

    while (true) {
        if (performance.now() - startWait > 300000) {
            throw new Error("Timeout error");
        }
        imagesResponse = await session.get(pollingUrl);
        if (imagesResponse.status !== 200) {
            throw new Error("Could not get results");
        }
        if (imagesResponse.data === "") {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
        } else {
            break;
        }
    }

    if (imagesResponse.data.errorMessage === "Pending") {
        throw new Error(
            "This prompt has been blocked by Bing. Bing's system flagged this prompt because it may conflict with their content policy. More policy violations may lead to automatic suspension of your access."
        );
    } else if (imagesResponse.data.errorMessage) {
        throw new Error(
            "Bing returned an error: " + imagesResponse.data.errorMessage
        );
    }

    const imageLinks = imagesResponse.data
        .match(/src="([^"]+)"/g)
        .map((src: string) => src.slice(5, -1));
    const normalImageLinks: string[] = Array.from(
        new Set(imageLinks.map((link: string) => link.split("?w=")[0]))
    );

    return normalImageLinks;
};

export const generateImagesLinks = async (prompt: string) => {
    const authCookie = bingImageCookie;

    if (!authCookie || !prompt) {
        throw new Error("Missing parameters");
    }

    // Create image generator session
    const session = createSession(authCookie);
    const imageLinks = await getImages(session, prompt);
    return imageLinks;
};