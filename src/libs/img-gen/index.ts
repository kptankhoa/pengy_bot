import axios, { AxiosInstance } from 'axios';
import querystring from 'querystring';
import { performance } from 'perf_hooks';
import { getBingImageToken } from 'libs/firebase';

const BING_URL = 'https://www.bing.com';

const createSession = (authCookie: string) => {
  const session = axios.create({
    headers: {
      accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh-TW;q=0.7,zh;q=0.6',
      'cache-control': 'max-age=0',
      'content-type': 'application/x-www-form-urlencoded',
      'Referrer-Policy': 'origin-when-cross-origin',
      referrer: 'https://www.bing.com/images/create/',
      origin: 'https://www.bing.com',
      'user-agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.54',
      cookie: `_U=${authCookie}`,
      'sec-ch-ua': '"Microsoft Edge";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
      'sec-ch-ua-mobile': '?0',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
    },
  });

  return session;
};

const getImages = async (session: AxiosInstance, prompt: string) => {
  console.info('Sending request...');
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
    redirectUrl = response.request.res.responseUrl.replace('&nfy=1', '');
  } else if (response.status !== 302) {
    console.error(
      `ERROR: the status is ${response.status} instead of 302 or 200`
    );
    throw new Error('Redirect failed');
  }
  const requestId = redirectUrl.split('id=')[1];
  await session.get(redirectUrl);

  const pollingUrl = `${BING_URL}/images/create/async/results/${requestId}?q=${urlEncodedPrompt}`;

  console.log('Waiting for results...');
  const startWait = performance.now();
  let imagesResponse;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (performance.now() - startWait > 300000) {
      throw new Error('Timeout error');
    }
    imagesResponse = await session.get(pollingUrl);
    if (imagesResponse.status !== 200) {
      throw new Error('Could not get results');
    }
    if (imagesResponse.data === '') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    } else {
      break;
    }
  }

  if (imagesResponse.data.errorMessage === 'Pending') {
    throw new Error(
      'This prompt has been blocked by Bing. Bing\'s system flagged this prompt because it may conflict with their content policy. More policy violations may lead to automatic suspension of your access.'
    );
  } else if (imagesResponse.data.errorMessage) {
    throw new Error(
      'Bing returned an error: ' + imagesResponse.data.errorMessage
    );
  }

  const imageLinks = imagesResponse.data
    .match(/src="([^"]+)"/g)
    .map((src: string) => src.slice(5, -1));
  const normalImageLinks: string[] = Array.from(
    new Set(imageLinks.map((link: string) => link.split('?w=')[0]))
  );

  return normalImageLinks;
};

export const generateImagesLinks = async (prompt: string) => {
  const authCookie = getBingImageToken();

  if (!authCookie || !prompt) {
    throw new Error('Missing parameters');
  }

  // Create image generator session
  const session = createSession(authCookie);
  const imageLinks = await getImages(session, prompt);
  return imageLinks;
};
