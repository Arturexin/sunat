import { Router } from 'express';
import { getNaturals, createNatural } from '../controllers/natural.controller.js';

const router = Router();

router.get('/naturals', getNaturals);
router.post('/createNatural', createNatural);

export default router;

