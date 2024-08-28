const {sealMessage} = require('mailauth');
const {dkimSign} = require('mailauth/lib/dkim/sign');

class Sign {
  async arc(email, privateKey) {
    return sealMessage(email.data, {
        signingDomain: email.domain,
        selector: 'test.rsa',
        privateKey: privateKey,
    });
  }

  async dkim(email, privateKey) {
    return dkimSign(email.data, {
      algorithm: 'rsa-sha256',
      signatureData: [
        {
          signingDomain: email.domain,
          selector: 'test.rsa',
          privateKey: privateKey,
          algorithm: 'rsa-sha256',
        },
      ],
    });
  }

}