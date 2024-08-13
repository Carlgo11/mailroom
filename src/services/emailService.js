const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EmailService {
  async processIncomingEmail(stream, session) {
    return new Promise((resolve, reject) => {
      let emailData = '';

      stream.on('data', (chunk) => {
        console.log(chunk)
        emailData += chunk.toString();
      });

      stream.on('end', () => {
        console.log('Received incoming email:', emailData);

        // Save the email to each recipient's Maildir
        Promise.all(session.envelope.rcptTo.map(recipient => {
          const mailbox = recipient.address.split('@')[0];
          return this.saveEmailToInbox(mailbox, emailData);
        }))
        .then(() => resolve())
        .catch(err => reject(err));
      });

      stream.on('error', (err) => {
        reject(new Error(`Error processing incoming email: ${err.message}`));
      });
    });
  }

  async saveEmailToInbox(mailbox, emailData) {
    try {
      const maildirPath = `/var/mail/vhosts/example.com/${mailbox}/Maildir`;
      this.createMaildirIfNotExists(maildirPath);

      const uniqueFilename = this.generateUniqueFilename();
      const emailPath = path.join(maildirPath, 'new', uniqueFilename);

      await fs.promises.writeFile(emailPath, emailData);
    } catch (err) {
      throw new Error(`Failed to save email to inbox: ${err.message}`);
    }
  }

  createMaildirIfNotExists(maildirPath) {
    const directories = ['cur', 'new', 'tmp'];
    directories.forEach(dir => {
      const dirPath = path.join(maildirPath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  generateUniqueFilename() {
    const timestamp = Date.now();
    const randomPart = crypto.randomBytes(16).toString('hex');
    return `${timestamp}.${randomPart}.localhost`;
  }
}

module.exports = new EmailService();
