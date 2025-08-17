import jwt from 'jsonwebtoken';
import { SECRET_JWT_KEY, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY, IS_PRODUCTION } from '../config.js';
import redisClient from '../redis_db.js';

export const generateAccessToken = (payload) =>{
    return jwt.sign(payload, SECRET_JWT_KEY, {
        exporesIn: `${parseInt(ACCESS_TOKEN_EXPIRY)}s`
    })
};

export const generateRefreshToken = (payload) => {
    return jwt.sign(payload, SECRET_JWT_KEY, {
        exporesIn: `${parseInt(REFRESH_TOKEN_EXPIRY)}s`
    })
};

export async function verifyToken(req, res, next) {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
        return res.status(401).json({
            status: 'error',
            message: 'Token faltante.'
        })
    }; 
    try {
        const decoded = jwt.verify(accessToken, SECRET_JWT_KEY);
        req.user = decoded;
        return next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Token inválido o expirado.'
        })
    };
};

export async function refreshToken (req, res) {
  const token = req.cookies.refresh_token;
  if (!token) return res.status(401).json({ status: 'error', message: 'No autorizado.' });

  try { 
    const decoded = jwt.verify(token, SECRET_JWT_KEY);

    const stored = await redisClient.get(`refresh:${decoded.id}`);
    if (stored !== token) {
      return res.status(403).json({ status: 'error', message: 'Token inválido.' });
    }

    const newAccessToken = generateAccessToken({
      id: decoded.id,
      username: decoded.username,
      name: decoded.name,
      role: decoded.role
    });

    res.cookie('access_token', newAccessToken, {
        httpOnly: true,
        sameSite: 'strict',
        secure: IS_PRODUCTION,
        maxAge: parseInt(ACCESS_TOKEN_EXPIRY) * 1000 // milisegundos
      })
      .json({ status: 'success', message: 'Token renovado.' });

  } catch (error) {
    return res.status(403).json({ status: 'error', message: 'Token inválido o expirado.' });
  }
};