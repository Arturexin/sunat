import { Router } from 'express';
import { verifyToken } from "../util/verifyToken.js"; //middleware verifica token válido
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getRoles, getSelectEmployees } from '../controllers/employees.controller.js';

const router = Router();

router.get('/select_employees', verifyToken, getSelectEmployees);
router.get('/roles', verifyToken, getRoles);
router.get('/employees', verifyToken, getEmployees);
router.post('/employee/add', verifyToken, createEmployee);
router.patch('/employee/update/:id', verifyToken, updateEmployee);
router.patch('/employee/delete/:id', verifyToken, deleteEmployee);
export default router;

