import { createClient } from 'redis';

const redisClient = createClient({
  socket: {
    host: 'redis',
    port: 6379
  }
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('end', () => {
  console.log('🛑 Redis connection closed');
});


export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('❌ Failed to connect to Redis', err);
  }
};

export default redisClient;
