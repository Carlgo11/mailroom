# Use a Node.js image based on Alpine Linux for smaller size
FROM node:alpine

ENV OUTBOX_PORT="465"
ENV OUTBOX_HOST="mail.example.com"
ENV OUTBOX_TLS_KEY_PATH="/certs/outbox/privkey.pem"
ENV OUTBOX_TLS_CERT_PATH="/certs/outbox/cert.pem"
ENV OUTBOX_TLS_MIN_VERSION="TLSv1.2"

# Set the working directory inside the container
WORKDIR /usr/src/outbox

# Copy the package.json file to the working directory
COPY package.json ./

# Install only the production dependencies
RUN npm install --production; apk add openssl; chmod +x /usr/local/bin/entrypoint.sh

# Copy the rest of the application code to the working directory
COPY . .

CMD ["node", "src/index.js"]