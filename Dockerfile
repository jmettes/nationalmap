FROM ubuntu:12.04

RUN apt-get -y update
RUN add-apt-repository ppa:chris-lea/node.js
RUN apt-get -y update
RUN apt-get -y install nodejs

ADD package.json package.json
RUN npm install

ADD public public
ADD server.js server.js

EXPOSE 3001
CMD npm start
