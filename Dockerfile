FROM node:16 as dependencies
WORKDIR /app
COPY package.json ./

COPY src ./src
RUN yarn install --frozen-lockfile


FROM node:16 as runner
WORKDIR /app
# CMD ["ls", "-l"]
RUN file="$(ls -1 /app)" && echo $file

ENV NODE_ENV production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package.json ./package.json
COPY --from=dependencies /app/src ./src


# COPY /app/models .

# COPY src/* ./
# COPY /* .
# COPY ../* .

EXPOSE 8000
CMD ["yarn", "start"]