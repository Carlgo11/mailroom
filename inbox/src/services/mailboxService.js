const fs = require('fs');
const path = require('path');

class mailboxService {

  createMaildirIfNotExists(maildirPath) {
    const directories = ['cur', 'new', 'tmp'];
    directories.forEach(dir => {
      const dirPath = path.join(maildirPath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, {recursive: true});
      }
    });
  }

  async saveEmailToInbox(mailbox, email) {
    try {
      const maildirPath = `${process.env.MAILBOX_PATH}/${mailbox}/Maildir`;
      this.createMaildirIfNotExists(maildirPath);

      const uniqueFilename = email.id();
      const emailPath = path.join(maildirPath, 'new', uniqueFilename);

      await fs.promises.writeFile(emailPath, email.data);
    } catch (err) {
      throw new Error(`Failed to save email to inbox: ${err.message}`);
    }
  }
}

module.exports = {mailboxService};