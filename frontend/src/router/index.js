import { createRouter, createWebHistory } from 'vue-router';
import { navBarRoutes } from './nav_bar.js';
import { verifyAuth } from '../services/crud.js';

const routes = [
    ...navBarRoutes,
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

// Guard de navegación asíncrono
router.beforeEach(async (to, from) => {
    if (to.name === 'login') return true;
    if (to.meta?.secure) {
        try {
            const isAuth = await verifyAuth(); // Verifica con el backend
            if (!isAuth) {
                console.log('Ruta protegida, usuario no autenticado.');
                return { name: 'notfound' };
            }
            console.log('Navegando a:', to.fullPath)
        } catch (error) {
            console.warn('Fallo al verificar auth:', e)
            return { name: 'notfound' }
        }
    }
    return true
})

export default router;