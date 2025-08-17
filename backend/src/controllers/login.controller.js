import { pool } from '../mysql_db.js';
import redisClient from '../redis_db.js';
import { validation } from '../util/validate.js';
import { userExists } from '../util/val_user.js';


export const loginUser = async (req, res) =>{
    let { user, password } = req.body;

    const err = validation.user(user) || validation.password(password);
    if (err) return res.status(400).json({
        status: 'error',
        message: 'Usuario o contraseña inválidos.'
    })

    try {
        const userCheck = await userExists(pool, user);
        if(!userCheck.validation) {
            return res.json({
                status: 'error',
                message: 'Usuario o contraseña inválidos.'
            })
        }
        const userData = userCheck.data[0];
        const isValidPassword = await bcrypt.compare(password, userData.password_hash);
        if (!isValidPassword) {
            return res.json({
                status: 'error',
                message: 'Usuario o contraseña inválidos.'
            })
        }
        const payload = {
            id: userData.id,
            username: userData.user,
            name: userData.name,
            role: userData.role
        }
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // Guardar refresh token en Redis con expiración
        await redisClient.set(`refresh:${ user.id }`, refreshToken, { EX: `${REFRESH_TOKEN_EXPIRY}` }); // 7 días

        const { password_hash: __dirname, ...userData_ } = userData;
        return res
            .status(200)
            .cookie('access_token', accessToken, {
                httpOnly: true,
                sameSite: 'strict',
                secure: IS_PRODUCTION,
                maxAge: parseInt(ACCESS_TOKEN_EXPIRY) * 1000  // 15 minutos
            })
            .cookie('refresh_token', refreshToken, {
                httpOnly: true,
                sameSite: 'strict',
                secure: IS_PRODUCTION,
                maxAge: parseInt(REFRESH_TOKEN_EXPIRY) * 1000  // 7 días
            })
            .json({
                status: 'success',
                message: 'Login exitoso.',
                userData_
            });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'No se puede iniciar sesión. | ' + (error),
        });
    }
}

export const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, SECRET_JWT_KEY);
        const redisKeysToDelete = [
          `employees:${decoded.id}`,
          `location:${decoded.id}`,
          `refresh:${decoded.id}`,
        ];
        await Promise.all(redisKeysToDelete.map(key => redisClient.del(key)));
      } catch (err) {
        console.warn('Refresh token inválido o expirado durante logout:', err.message);
      }
    }

    res.clearCookie('access_token', {
      httpOnly: true,
      sameSite: 'strict',
      secure: IS_PRODUCTION,
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: 'strict',
      secure: IS_PRODUCTION,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Logout exitoso.'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Error al cerrar sesión. | ' + error.message
    });
  }
};