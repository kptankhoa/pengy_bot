import { setUpBot } from 'libs/chatbot';
import http from 'http';
import { PORT } from 'const/settings';

setUpBot();

setInterval(() => {
  console.log('interval nef');
}, 10 * 60 * 1000);

const server = http.createServer();

server.listen(PORT);
