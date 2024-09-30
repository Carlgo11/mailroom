export async function checkForSpam(email) {
  try {
    const emailContent = `${email.serializeHeaders()}\r\n\r\n${email.body}`;
    const res = await fetch(`${process.env.RSPAMD_URL || 'http://rspamd:11334'}/checkv2`, {
      method: 'POST',
      headers: {
        'Pass': 'all',
        'Content-Type': 'application/octet-stream',
        'Password': process.env.RSPAMD_PASSWORD,
        'From': email.from,
        'Rcpt': email.to.join(', '),
        'Queue-Id': email.id,
        'Helo': email.hostNameAppearsAs,
        'IP': email.remoteAddress,
        'Hostname': email.clientHostname,
      },
      body: Buffer.from(emailContent, 'utf8'),
    });
    return res.json();
  } catch (error) {
    console.error('Error checking email for spam:', error);
    throw new Error('Spam check failed');
  }
}