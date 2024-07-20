FROM node:20

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY --chown=node:node package*.json ./

USER node

COPY --chown=node:node . .

RUN npm install

EXPOSE 4200

CMD [ "npm", "run", "start" ]
