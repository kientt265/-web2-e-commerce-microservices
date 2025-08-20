import { createClient } from 'redis';

const redis = createClient({
  socket: {
    host: 'redis',
    port: 6379
  }
});

redis.on('ready', () => {
  console.log('✅ Redis client ready');
});

redis.on('end', () => {
  console.log('🛑 Redis connection closed');
});


export const connectRedis = async () => {
  try {
    await redis.connect();
  } catch (err) {
    console.error('❌ Failed to connect to Redis', err);
  }
};

export default redis;
