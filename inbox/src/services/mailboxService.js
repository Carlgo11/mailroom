const fs = require('fs');
const path = require('path');
const userService = require('./userService');

class mailboxService {

  async saveEmail(adress, email) {
    const mailbox = await userService.userExists(adress)
    try {
      const maildirPath = `${process.env.MAILBOX_PATH}/${mailbox}/Maildir`;
      const directories = ['cur', 'new', 'tmp'];
      directories.forEach(dir => {
        const dirPath = path.join(maildirPath, dir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, {recursive: true});
        }
      });

      const uniqueFilename = email.id;
      const emailPath = path.join(maildirPath, 'new', uniqueFilename);

      // Convert headers back into a string format
      const headersString = Object.entries(email.headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\r\n');

      // Combine headers and body
      const fullEmail = `${headersString}\r\n\r\n${email.body}`;

      await fs.promises.writeFile(emailPath, fullEmail);
      return true
    } catch (err) {
      throw new Error(`Failed to save email to inbox: ${err.message}`);
    }
  }
}

module.exports = new mailboxService;