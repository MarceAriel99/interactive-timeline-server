# express/Dockerfile
FROM node:21-alpine3.19

#Install rsync
RUN apk update
RUN apk add rsync

# Set the environment variable
ENV PATH /app/node_modules/.bin:$PATH

# Create and define the node_modules's cache directory.
WORKDIR /usr/src/cache

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

RUN npm install
RUN npm install express pg dotenv cors

WORKDIR /app

EXPOSE 4000