import {Router} from 'express';
import {login, register} from '../services/userService.js';
import {generateCertificate} from '../services/clientCertService.js';

const router = Router();

router.post('/users/register', async (req, res) => {
  console.log(req.body.username, req.body.password);
  try {
    const status = await register(req.body.username, req.body.password);
    return res.status(201).
        send(JSON.stringify(status));
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
});

router.get('/users/:user/', async (req, res) => {
  return res.send(await login(req.params['user'], req.query.password));
});

router.get('/users/:user/certificate', async (req, res) => {
  try {
    const cert = generateCertificate(req.params['user']);
    res.sendFile(await cert)
  }catch (err){
    res.status(500).send(`Error: ${err.message}`);
  }
})

export default router;