import { Router } from 'express';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../controllers/location.controller.js';

const router = Router();

router.get('/locations', getLocations);
router.post('/location/add', createLocation);
router.patch('/location/update/:id', updateLocation);
router.patch('/location/delete/:id', deleteLocation);

export default router;