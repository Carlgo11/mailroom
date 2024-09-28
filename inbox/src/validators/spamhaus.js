export class Spamhaus {
  constructor() {
    this.enabled = !!process.env.SPAMHAUS_API_KEY;
    this.cache = {};
  }

  async lookupIP(address) {
    if (!this.enabled) return false;
    if (this.cache[address]) return this.cache[address];

    const res = await fetch(
        `https://apibl.spamhaus.net/lookup/v1/ZEN/${address}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.SPAMHAUS_API_KEY}`,
          },
        });
    const status = res.status === 200;
    this.cache[address] = status;
    return status;
  }
}

export default new Spamhaus();