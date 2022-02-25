FROM node:latest

WORKDIR /usr/src/app

ADD . /usr/src/app

CMD ["npm","run","notifhy"]