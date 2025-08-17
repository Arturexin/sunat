import { Router } from 'express';
import { getTransit, createTransit, updateTransit, deleteTransit, createTransitBulk } from '../controllers/transit.controller.js';

const router = Router();

router.get('/transits', getTransit);
router.post('/transit/add', createTransit);
router.post('/transits/bulk', createTransitBulk);
router.patch('/transit/update/:id', updateTransit);
router.patch('/transit/delete/:id', deleteTransit);

export default router;
