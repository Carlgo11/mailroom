import { Response } from '@carlgo11/smtp-server';

export default async function handleMail(address, session, args) {

  // Validate user authenticated
  if (!session.username)
    throw new Response('Authentication required', 530, [5, 7, 0]);

  // Validate username matches address
  if (session.username !== address)
    throw new Response(`${session.username} not allowed to send emails as ${address}`, 550, [5, 7, 1]);

  // Validate optional SIZE parameter
  const maxMessageSize = 10 * 1024 * 1024; // 10 MB
  if (args.SIZE && parseInt(args.SIZE, 10) > maxMessageSize)
    throw new Response('Message size exceeds fixed maximum message size', 552, [5, 3, 4]);

  return true;
}
