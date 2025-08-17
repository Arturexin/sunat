import express from 'express';
import dataRoutes from './routes/data.routes.js';
import employeesRoutes from './routes/employees.routes.js';
import projectRoutes from './routes/project.routes.js';
import locationRoutes from './routes/location.routes.js';
import areaRoutes from './routes/area.routes.js';
import transitRoutes from './routes/transit.routes.js';
import cors from 'cors';

const app = express();

app.use(cors())
app.use(express.json())

app.use('/api', dataRoutes);
app.use('/api', projectRoutes);
app.use('/api', employeesRoutes);
app.use('/api', locationRoutes);
app.use('/api', areaRoutes);
app.use('/api', transitRoutes);


export default app;