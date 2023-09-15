import { setUpBot } from 'libs/chatbot';

setUpBot();

setInterval(() => {
  console.log('');
}, 5 * 60 * 1000);
