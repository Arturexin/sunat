import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dataRoutes from './routes/data.routes.js';
import employeesRoutes from './routes/employees.routes.js';
import projectRoutes from './routes/project.routes.js';
import locationRoutes from './routes/location.routes.js';
import transitRoutes from './routes/transit.routes.js';
import loginRoutes from './routes/login.routes.js';
import usersRoutes from './routes/users.routes.js';
import naturalsRoutes from './routes/natural.routes.js';



const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // tu frontend
  credentials: true                 // permite cookies
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api', dataRoutes);
app.use('/api', projectRoutes);
app.use('/api', employeesRoutes);
app.use('/api', locationRoutes);
app.use('/api', transitRoutes);
app.use('/api', loginRoutes);
app.use('/api', usersRoutes);
app.use('/api', naturalsRoutes);
app.use((req, res, next) => {
  console.log('Cookie header:', req.headers.cookie); // muestra cookies enviadas por el cliente
  next();
});


export default app;