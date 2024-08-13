const fs = require('fs');
const path = require('path');

class UserService {
  constructor() {
    this.aliases = this.loadAliases();
  }

  loadAliases() {
    try {
      const aliasesPath = path.join(__dirname, '../../aliases.json');
      const data = fs.readFileSync(aliasesPath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error loading aliases:', err);
      return {};
    }
  }

  userExists(recipient) {
    console.log(recipient);
    const user = recipient.split('@')[0];
    const mailboxPath = `/var/mail/vhosts/example.com/${user}/Maildir`;

    // Check if a real mailbox exists
    if (fs.existsSync(mailboxPath)) return true;

    // Check if an alias exists
    return !!this.aliases[recipient];
  }
}

module.exports = new UserService();
