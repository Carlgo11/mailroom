import openpgp from 'openpgp';

export class Pgp {
  async find(address) {
    const res = await fetch(
        `https://keys.openpgp.org/vks/v1/by-email/${encodeURIComponent(
            address)}`);

    if (res.status !== 200)
      return false;

    const stream = res.body;
    let chunks = [];
    for await(const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks).toString('utf-8');
  }

  async encrypt(email, pubkey) {
    // Include Content-Type in the encrypted body
    const ctype = {'Content-Type': email.headers['content-type']};

    const [message, pubkeys] = await Promise.all([
      openpgp.createMessage(
          {text: `${email.serializeHeaders(ctype)}\r\n\r\n${email.body}`}),
      openpgp.readKey({armoredKey: pubkey}),
    ]);

    return openpgp.encrypt({
      message,
      encryptionKeys: pubkeys,
    });
  }
}

export default new Pgp();