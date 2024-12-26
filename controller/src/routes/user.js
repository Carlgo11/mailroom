import { Router } from 'express';
import { getUser, listUsers, register } from '../services/userService.js';
import { generateCertificate } from '../services/clientCertService.js';

const router = Router();

router.post('/users/register', async (req, res) => {
  try {
    const status = await register(req.body.username, req.body.password);
    return res.status(201).
      send(JSON.stringify(status));
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message);
  }
});

router.get('/users/:user/', async (req, res) => {
  return res.send(await getUser(req.params.user));
});

router.get('/users/', async (req, res) => {
  const users = await listUsers();
  return res.send(JSON.stringify(users));
});

router.get('/users/:user/certificate', async (req, res) => {
  try {
    const cert = generateCertificate(req.params['user']);
    res.sendFile(await cert);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

export default router;