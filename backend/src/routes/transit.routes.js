import { Router } from 'express';
import { verifyToken } from "../util/verifyToken.js";
import { getTransit, createTransit, updateTransit, deleteTransit, createTransitBulk, getDataSelect } from '../controllers/transit.controller.js';

const router = Router();

router.get('/select', verifyToken, getDataSelect);
router.get('/transits', verifyToken, getTransit);
router.post('/transit/add', verifyToken, createTransit);
router.post('/transits/bulk', verifyToken, createTransitBulk);
router.patch('/transit/update/:id', verifyToken, updateTransit);
router.patch('/transit/delete/:id', verifyToken, deleteTransit);

export default router;
