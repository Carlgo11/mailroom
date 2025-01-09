FROM node:20-alpine
WORKDIR /app
COPY . /app/
COPY smtpd.conf /etc/smtpd/smtpd.conf
RUN apk upgrade -U; apk add --no-cache opensmtpd
RUN npm i --omit=dev
COPY --chmod=500 entrypoint.sh /entrypoint
ENTRYPOINT ["/entrypoint"]
CMD ["src/server.js"]