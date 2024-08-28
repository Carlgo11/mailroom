const openpgp = require('openpgp');

class PGP {
  async find(address) {
    const res = await fetch(
        `https://keys.openpgp.org/vks/v1/by-email/${encodeURIComponent(
            address)}`);

    if (res.status !== 200)
      return false;

    const stream = res.body;
    let chunks = [];
    for await(const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }

    const data = Buffer.concat(chunks).toString('utf-8');
    return openpgp.readKey({armoredKey: data});
  }

  async encrypt(email, pubkey) {
    const [message, pubkeys] = await Promise.all([
      openpgp.createMessage({text: email.body}),
      openpgp.readKey({armoredKey: pubkey}),
    ]);

    return openpgp.encrypt({
      message,
      encryptionKeys: pubkeys,
      signingKeys: email.pgp,
    });
  }

  async signature(key, passphrase) {
    return openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({
        armoredKey: key,
      }), passphrase,
    });
  }
}

module.exports = new PGP();