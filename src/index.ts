import { setUpBot } from 'libs/chatbot';

setUpBot();

setInterval(() => {
  console.log('');
}, 10 * 60 * 1000);
