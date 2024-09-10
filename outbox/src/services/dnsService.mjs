import Tangerine from 'tangerine';

const resolver = new Tangerine();

export async function fetchMX(domain) {
  try {
    const records = await resolver.resolveMx(domain);
    return records.sort((a, b) => a.priority - b.priority).map(a => a.exchange);
  } catch (_) {
    return [];
  }
}

export async function fetchTLSA(domain) {
  try {
    const records = await resolver.resolveTlsa(`_25._tcp.${domain}`);
    return records.map((record) => {
      return {
        usage: record.usage,
        selector: record.selector,
        matchingType: record.mtype,
        cert: record.cert,
      };
    });
  } catch (_) {
    return [];
  }
}

fetchTLSA(process.argv[2]).then(r => console.log(r));
