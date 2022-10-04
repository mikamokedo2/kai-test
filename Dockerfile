FROM node:16 as dependencies
WORKDIR /app
COPY package.json ./
RUN yarn install --frozen-lockfile


FROM node:16 as runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package.json ./package.json
COPY /* ./

EXPOSE 8000
CMD ["yarn", "start"]