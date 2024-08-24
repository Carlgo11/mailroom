const {authenticate} = require('mailauth');

async function Validate(message, {remoteAddress, hostNameAppearsAs, envelope}) {
  return authenticate(message, {
    ip: remoteAddress,
    helo: hostNameAppearsAs,
    sender: envelope.mailFrom.address,
    mta: process.env.INBOX_HOST,
  });
}

module.exports = {Validate};