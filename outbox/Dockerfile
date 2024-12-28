FROM node:20-alpine
WORKDIR /app
COPY . /app/
RUN npm i --omit=dev
CMD ["src/server.js"]