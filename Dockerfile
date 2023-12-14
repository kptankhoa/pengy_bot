FROM node:16-alpine

ARG START=start
ENV START_CMD=${START}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

CMD npm run ${START_CMD}
