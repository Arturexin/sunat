import { Router } from 'express';
import { verifyToken } from "../util/verifyToken.js";
import { getLocations, createLocation, updateLocation, deleteLocation, getSelectLocations } from '../controllers/location.controller.js';

const router = Router();

router.get('/select_locations', verifyToken, getSelectLocations);
router.get('/locations', verifyToken, getLocations);
router.post('/location/add', verifyToken, createLocation);
router.patch('/location/update/:id', verifyToken, updateLocation);
router.patch('/location/delete/:id', verifyToken, deleteLocation);

export default router;