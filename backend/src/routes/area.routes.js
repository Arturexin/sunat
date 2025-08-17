import { Router } from "express";
import { getAreas, createArea, updateArea, deleteArea } from '../controllers/area.Controller.js';

const router = Router();

router.get('/areas', getAreas);
router.post('/area/add', createArea);
router.patch('/area/update/:id', updateArea);
router.patch('/area/delete/:id', deleteArea);

export default router;