export class ipScoreValidator {
  constructor() {
    this.enabled = process.env.IPSCORE_ENABLED || false;
  }

  async lookupIP(address) {
    if (this.enabled) {
      const form = new FormData();
      form.append('ip', address);

      const res = await fetch(
          `https://ip-score.com/fulljson`, {
            body: form,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'MailRoom (+https://github.com/Carlgo11/mailroom/)',
            },
          });

      const {blacklists} = await res.json();
      for (const list of Object.keys(blacklists)) {
        if (blacklists[list] === 'listed')
          return list
      }
    }
    return null;
  }
}

export default new ipScoreValidator();
