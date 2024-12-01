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

export async function spf(ip, sender, helo) {
  const { spf } = require('mailauth/lib/spf');
  const result = await spf({
    ip,
    sender,
    helo,
  });

  return result.status.result === 'fail';
}