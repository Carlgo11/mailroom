export class ipQS {
  constructor() {
    this.enabled = !!process.env.IPQS_API_KEY;
    this.key = process.env.IPQS_API_KEY;
  }

  async lookupIP(address) {
    if (!this.enabled) return false;
    const res = await fetch(
        `https://ipqualityscore.com/api/json/ip/${this.key}/${address}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        });
    const json = await res.json();

    // Return fraud score if present, or 0 to bypass scoring.
    return json['fraud_score'] || 0;
  }
}

export default new ipQS();