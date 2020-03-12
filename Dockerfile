FROM node:alpine as builder

ENV NODE_ENV=production

RUN apk add --no-cache g++ linux-headers make python

WORKDIR /app
COPY ./package.json .
COPY ./yarn.lock .
RUN yarn install --production=true

FROM node:alpine as app

ENV NODE_ENV=production

WORKDIR /app
COPY ./package.json .
COPY ./yarn.lock .

COPY --from=builder /app/node_modules/ ./node_modules/

COPY ./dist/ ./

CMD node index.js
