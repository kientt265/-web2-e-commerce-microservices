import redisClient from '../config/redis';

export const setCartCache = async (userId: string, cartData: any) => {
  const key = `cart:${userId}`;
  await redisClient.set(key, JSON.stringify(cartData), {
    EX: 3600 
  });
};

export const getCartCache = async (userId: string) => {
  const key = `cart:${userId}`;
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export const deleteCartCache = async (userId: string) => {
  const key = `cart:${userId}`;
  await redisClient.del(key);
};
