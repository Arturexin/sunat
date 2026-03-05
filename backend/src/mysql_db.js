import { createPool } from 'mysql2/promise'
import { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE } from './config.js'

export const pool = createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
    database: DB_DATABASE,
    timezone: 'Z', // <-- fuerza a tratar todo como UTC
    charset: 'utf8mb4' // asegura soporte completo de UTF-8
});
// Verifica conexión inmediatamente
try {
  // Fuerza la conexión a usar UTF-8 en la sesión
  await pool.query('SET NAMES utf8mb4');
  const connection = await pool.getConnection();
  console.log(`✅ Conectado a MySQL en puerto ${DB_PORT}`);
  connection.release(); // Importante: liberar conexión
} catch (error) {
  console.error('❌ Error al conectar a MySQL:', error.message);
}