import { createRouter, createWebHistory } from 'vue-router';
import { navBarRoutes } from './nav_bar.js';

const routes = [
    ...navBarRoutes,
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

export default router;