FROM sitespeedio/node:ubuntu-20.04-nodejs-16.13.1

RUN apt-get install chromium-browser

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 8080
CMD [ "npm", "start" ]
