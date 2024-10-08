import Module from "node:module";

const require = Module.createRequire(import.meta.url);

export async function Validate(email) {
  const {authenticate} = require('mailauth');
  return authenticate(email.full_email(), {
    ip: email.remoteAddress,
    helo: email.ehlo,
    sender: email.from,
    mta: process.env.INBOX_HOST,
  });
}
