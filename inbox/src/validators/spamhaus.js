export class Spamhaus {
  constructor() {
    this.enabled = !!process.env.SPAMHAUS_API_KEY;
  }

 async lookupIP(address) {
    if (!this.enabled) return false;

    const res = await fetch(
        `https://apibl.spamhaus.net/lookup/v1/ZEN/${address}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.SPAMHAUS_API_KEY}`,
          },
        });
    return res.status === 200;
  }
}

export default new Spamhaus();