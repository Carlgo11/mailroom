import fs from 'fs';

export function debug(message, id = null) {
  if (process.env.NODE_ENV === 'development')
    output(`[DEBUG] ${id ? '<' + id + '> ':''} ${message}`);
}

export function info(message, id = null) {
  output(`${id ? '<' + id + '> ':''}${message}`);
}

export function error(message,id = null) {
  output(`[ERROR] ${id ? '<' + id + '> ':''} ${message}`);
}

function output(message) {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  console.log(`[${formattedDate}] ${message}`);
  fs.appendFileSync(process.env.OUTBOX_LOG_FILE,`[${formattedDate}] ${message}\n`)
}