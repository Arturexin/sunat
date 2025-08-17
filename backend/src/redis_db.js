import { createClient } from 'redis';
import { REDIS_HOST, REDIS_PORT } from './config.js';

const redisClient = createClient({
    url: `redis://${REDIS_HOST}:${REDIS_PORT}`//o usa el nombre del contenedor si están en la misma red
});

redisClient.on('error', (err) => console.error('❌ Redis error:', err));
redisClient.on('connect', () => console.log(`✅ Conectado a Redis en puerto ${REDIS_PORT}`));

await redisClient.connect();

export default redisClient;