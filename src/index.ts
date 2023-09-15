import { setUpBot } from 'libs/chatbot';
import http from 'http';

setUpBot();

setInterval(() => {
  console.log('');
}, 10 * 60 * 1000);

const server = http.createServer();

server.listen(3000);
