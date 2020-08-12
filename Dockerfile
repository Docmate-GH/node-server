FROM node:12

EXPOSE 3000/tcp

RUN mkdir /data && mkdir /data/images
VOLUME [ "/data" ]

COPY . /server
WORKDIR /server

RUN npm i -g yarn
RUN yarn

RUN npm run build

ENV NODE_ENV=production

CMD [ "node", "lib/index.js" ]
