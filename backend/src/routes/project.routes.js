import { Router } from 'express';
import { createProject, getProjects, updateProject, deleteProject } from '../controllers/project.controller.js';

const router = Router();

router.get('/projects', getProjects);
router.post('/project/add', createProject);
router.patch('/project/update/:id', updateProject);
router.patch('/project/delete/:id', deleteProject);

export default router;
