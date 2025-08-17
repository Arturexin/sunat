import { Router } from 'express';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../controllers/employees.controller.js';

const router = Router();

router.get('/employees', getEmployees);
router.post('/employee/add', createEmployee);
router.patch('/employee/update/:id', updateEmployee);
router.patch('/employee/delete/:id', deleteEmployee);

export default router;

