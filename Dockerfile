FROM node:0.10-onbuild
RUN apt-get -y update
ADD package.json
ADD main.js
ADD public
RUN npm install && npm start
EXPOSE 3001
CMD 
