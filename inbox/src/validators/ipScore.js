import log from '../services/logService.js';

export class ipScoreValidator {
  async lookupIP(address) {
    const form = new FormData();
    form.append('ip', address);
    const res = await fetch(
        `https://ip-score.com/fulljson`, {
          body: form,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'MailRoom (+https://github.com/Carlgo11/mailroom/)'
          }
        });
    const json = await res.json();
    log.debug(json);
    const {blacklists} = json;
    Object.keys(blacklists).forEach(list => {
      if(blacklists[list] === 'listed')
        throw new Error(`${address} reported suspicious by ${list}.`)
    })
  }
}

export default new ipScoreValidator();
