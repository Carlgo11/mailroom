import fs from 'fs';
import path from 'path';

export async function saveEmail(address, email) {
  try {
    const maildirPath = `${process.env.MAILBOX_PATH}/${address}/Maildir`;
    const directories = ['cur', 'new', 'tmp'];
    directories.forEach(dir => {
      const dirPath = path.join(maildirPath, dir);
      if (!fs.existsSync(dirPath))
        fs.mkdirSync(dirPath, {recursive: true});
    });

    const emailPath = path.join(maildirPath, 'new', email.id);

    // Serialize headers
    const headersString = serializeHeaders(email.headers);

    // Combine headers and body
    const fullEmail = `${headersString}\r\n\r\n${email.body}`;

    await fs.promises.writeFile(emailPath, fullEmail);
    return true;
  } catch (err) {
    throw new Error(`Failed to save email to inbox: ${err.message}`);
  }
}

// Method to serialize headers
function serializeHeaders(headers) {
  return Object.entries(headers).map(([key, value]) => {
    // Check if value is an object with value and params
    if (value && typeof value === 'object' && value.value) {
      let headerValue = value.value;
      if (value.params) {
        const paramsString = Object.entries(value.params).
            map(([paramKey, paramValue]) => `${paramKey}=${paramValue}`).
            join('; ');
        headerValue += `; ${paramsString}`;
      }
      return `${key}: ${headerValue}`;
    }
    // Otherwise, treat it as a simple string
    return `${key}: ${value}`;
  }).join('\r\n');
}

export default saveEmail;