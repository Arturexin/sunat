import { Router } from 'express';
import { verifyToken } from "../util/verifyToken.js"; //middleware verifica token válido
import { createProject, getProjects, updateProject, deleteProject, getSelectProjects, getEmpresa } from '../controllers/project.controller.js';

const router = Router();

router.get('/select_projects', verifyToken, getSelectProjects);
router.get('/empresa', verifyToken, getEmpresa);
router.get('/projects', verifyToken, getProjects);
router.post('/project/add', verifyToken, createProject);
router.patch('/project/update/:id', verifyToken, updateProject);
router.patch('/project/delete/:id', verifyToken, deleteProject);
export default router;
