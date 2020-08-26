FROM node:12

EXPOSE 3000/tcp

RUN mkdir /apps

COPY . /apps/server

WORKDIR /apps

RUN git clone https://github.com/Docmate-GH/dashboard.git web

WORKDIR /apps/web

ENV DOC_DOMAIN=https://docs.docmate.io
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
