FROM ubuntu:12.04

RUN apt-get -y update
RUN apt-get -y install python-software-properties
RUN apt-get -y install software-properties-common
RUN add-apt-repository ppa:chris-lea/node.js
RUN apt-get -y update
RUN apt-get -y install nodejs

ADD package.json package.json
RUN npm cache clean -f; npm install -g npm; npm install

ADD public public
ADD server.js server.js

EXPOSE 3001
CMD npm start
