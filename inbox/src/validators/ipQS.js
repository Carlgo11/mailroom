export class ipQS {
  constructor() {
    this.key = process.env.IPQS_API_KEY || false;
  }

  async lookupIP(address) {
    if (!this.key) return 0;

    const res = await fetch(
        `https://ipqualityscore.com/api/json/ip/${this.key}/${address}`);
    const {fraud_score} = await res.json();

    // Return fraud score if present, or 0 to bypass scoring.
    return fraud_score || 0;
  }
}

export default new ipQS();