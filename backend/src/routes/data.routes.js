import { Router } from 'express';
import { postData } from '../controllers/data.controller.js';

const router = Router();

router.post('/procesar-json', postData);

export default router;