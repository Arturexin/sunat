import { Router } from 'express';
import { getUsers, getCoins } from '../controllers/users.controller.js';

const router = Router();

router.get('/users', getUsers);
router.get('/coins', getCoins);

export default router;