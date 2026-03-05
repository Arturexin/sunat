import { Router } from 'express';
import { loginUser, logoutUser } from '../controllers/login.controller.js';
import { verifyToken, refreshToken } from '../util/verifyToken.js';//middleware verifica token válido

const router = Router();

router.post('/login', loginUser);
router.post('/logout', logoutUser);

//Ruta protegida: usa esto para saber que el usuario sigue autenticado al cambiar de rutas
router.get('/verify', verifyToken, (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Token válido',
        user: req.user // puedes devolver info básica del usuario si quieres
    });
});


export default router;

