FROM node:latest

WORKDIR /usr/src/app

ADD . /usr/src/app

RUN npm install

RUN npm run build

RUN npm install --omit=dev

CMD ["npm","run","docker"]