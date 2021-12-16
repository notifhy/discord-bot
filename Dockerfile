FROM node:17.2.0

WORKDIR /usr/src/app

COPY package.json .

RUN npm install

ADD . /usr/src/app

CMD ["npm","run","dev"]