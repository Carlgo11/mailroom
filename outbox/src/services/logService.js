import fs from 'fs/promises';

export class Log {
  constructor() {
    if (!process.env.INBOX_LOG_FILE)
      throw new Error('No log file path specified. Check variables');

    fs.stat(process.env.INBOX_LOG_FILE).catch(async (e) => {
      if (e.code === 'ENOENT')
        return await fs.appendFile(process.env.INBOX_LOG_FILE, '');

      throw e;
    });
  }

  debug(message, id = null) {
    if (process.env.NODE_ENV === 'development')
      this.output(`[DEBUG] ${id ? '<' + id + '> ':''} ${message}`);
  }

  info(message, id = null) {
    this.output(`${id ? '<' + id + '> ':''}${message}`);
  }

  error(message, id = null) {
    this.output(`[ERROR] ${id ? '<' + id + '> ':''} ${message}`);
  }

  async output(message) {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    console.log(`[${formattedDate}] ${message}`);
    await fs.appendFile(
        process.env.OUTBOX_LOG_FILE,
        `[${formattedDate}] ${message}\n`,
    );
  }
}

export default new Log();