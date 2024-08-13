require('dotenv').config();

class AuthService {
  validateCredentials(username, password) {
    return new Promise((resolve, reject) => {
      try {
        // In this example, credentials are stored in environment variables
        const validUsername = process.env.SMTP_USER;
        const validPassword = process.env.SMTP_PASS;

        // Simple check to validate credentials
        if (username === validUsername && password === validPassword) {
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = new AuthService();
