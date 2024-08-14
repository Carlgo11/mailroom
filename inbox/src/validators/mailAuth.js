const {authenticate} = require('mailauth');

async function Validate(stream, {remoteAddress, hostNameAppearsAs, envelope}) {
  return authenticate(stream, {
    ip: remoteAddress,
    helo: hostNameAppearsAs,
    sender: envelope.mailFrom.address,
  });
}

module.exports = {Validate};