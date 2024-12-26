import { Router } from 'express';
import {
  fetchDKIMRecord,
  generateDKIMKeys,
} from '../services/dkimCertService.js';

const router = Router();

router.post('/dkim/:domain', async (req, res) => {
  generateDKIMKeys(req.params.domain, process.env.DKIM_SIZE || 4096).
    then(record => res.send(record)).
    catch(err => res.status(500).send(err.message));
});

router.get('/dkim/:domain', async (req, res) => {
  fetchDKIMRecord(req.params.domain).
    then(record => res.send(record)).
    catch(err => res.status(500).send(err.message));
});

export default router;