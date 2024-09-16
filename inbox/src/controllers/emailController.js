import EmailService from '../services/emailService.js';
export async function handleIncomingEmail(stream, session) {
  try {
    await EmailService.processIncomingEmail(stream, session);
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}