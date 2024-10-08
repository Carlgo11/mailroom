import EmailService from '../services/emailService.js';
export async function handleIncomingEmail(message, session) {
  try {
    await EmailService.processIncomingEmail(message, session);
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}
