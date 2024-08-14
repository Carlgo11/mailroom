const crypto = require('crypto');

class Email {
  constructor({
                id = this.generateID(),
                from = '',
                to = [],
                data = '',
              } = {}) {
    this.id = id; // Unique identifier for the email
    this.from = from;            // Sender's address
    this.to = to;                // Array of recipient addresses
    this.data = data;      // Content/body of the email
  }

  parseStream(stream) {
    return new Promise((resolve, reject) => {
      let emailData = '';

      stream.on('data', (chunk) => emailData += chunk.toString());

      stream.on('end', () => {
        this.data = emailData;
        resolve();
      });

      stream.on('error', (err) => reject(
          new Error(`Error processing incoming email: ${err.message}`),
      ));
    });
  }

  generateID() {
    const timestamp = Date.now();
    const randomPart = crypto.randomBytes(16).toString('hex');
    return `${timestamp}.${randomPart}.localhost`;
  }

  // Method to add a recipient
  addRecipient(recipient) {
    this.to.push(recipient);
  }

  // Method to serialize the email for storage or transmission
  serialize() {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      data: this.data,
    };
  }
}

module.exports = Email;
