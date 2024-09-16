import Module from "node:module";

const require = Module.createRequire(import.meta.url);

export async function Validate(message, {remoteAddress, hostNameAppearsAs, envelope}) {
  const {authenticate} = require('mailauth');
  return authenticate(message, {
    ip: remoteAddress,
    helo: hostNameAppearsAs,
    sender: envelope.mailFrom.address,
    mta: process.env.INBOX_HOST,
  });
}
