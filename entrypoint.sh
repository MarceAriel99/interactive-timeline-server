#!/bin/sh

rsync -arv /usr/src/cache/node_modules/. /app/node_modules/
exec node "index.js"