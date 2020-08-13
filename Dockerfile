FROM node:12

EXPOSE 3000/tcp

RUN mkdir /apps

COPY . /apps/server

RUN git clone https://djyde:${TOKEN}@github.com/Docmate-GH/web.git

WORKDIR /apps/web

RUN yarn && npm run build
RUN mv -f dist/index.html ../server/views/index.html && \
  cp -rf dist/* ../server/static

WORKDIR /apps/server

RUN mkdir /data && mkdir /data/images
VOLUME [ "/data" ]

RUN yarn

RUN npm run build

ENV NODE_ENV=production

CMD [ "node", "lib/index.js" ]
