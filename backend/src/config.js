import {config} from 'dotenv'

config()
export const PORT = process.env.PORT || 3000

export const DB_HOST = process.env.DB_HOST || 'localhost'
export const DB_PORT = process.env.DB_PORT || 3306
export const DB_USER = process.env.DB_USER || 'root'
export const DB_PASSWORD = process.env.DB_PASSWORD || ''
export const DB_DATABASE = process.env.DB_DATABASE || 'c_p_sunat'

export const REDIS_HOST = process.env.REDIS_HOST || 'localhost'
export const REDIS_PORT = process.env.REDIS_PORT || 6379
export const KEY_REDIS_EXPIRY = Number(process.env.KEY_REDIS_EXPIRY) || 43200

export const SAL_ROUNDS = Number(process.env.SAL_ROUNDS) || 10/* número de vueltas para la encriptación */
export const SECRET_JWT_KEY = process.env.SECRET_JWT_KEY || 'esta-es-la-clave-secreta-del-token-lo-mas-grande-pisible'

export const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY
export const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY
export const NODE_ENV = process.env.NODE_ENV || 'development'
export const IS_PRODUCTION = NODE_ENV === 'production'

export const ACTIVO = process.env.ACTIVO || 1
export const INACTIVO = process.env.INACTIVO || 0