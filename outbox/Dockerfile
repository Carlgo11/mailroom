# Use a Node.js image based on Alpine Linux for smaller size
FROM node:alpine

# Set the working directory inside the container
WORKDIR /usr/src/outbox

# Copy the package.json file to the working directory
COPY package.json ./

# Copy the entrypoint.sh script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

# Install only the production dependencies
RUN npm install --production; apk add openssl; chmod +x /usr/local/bin/entrypoint.sh

# Copy the rest of the application code to the working directory
COPY . .

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

CMD ["node", "src/index.js"]