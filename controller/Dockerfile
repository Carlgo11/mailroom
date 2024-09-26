FROM node:slim
WORKDIR /usr/src/controller

ENV REDIS_HOST="redis_mail"
ENV REDIS_PORT="6379"
ENV CONTROLLER_PORT="6804"
ENV CLIENT_CERT_PATH="/certs/clients/users/"
ENV CLIENT_CERT_CA_CERT="/certs/clients/ca-cert.pem"
ENV CLIENT_CERT_CA_KEY="/certs/clients/ca-key.pem"

COPY package.json ./
RUN npm install --production

COPY . .

ENTRYPOINT ["sh", "scripts/entrypoint.sh"]

CMD ["node", "src/server.js"]
