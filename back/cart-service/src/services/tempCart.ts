import redis from "../config/redis";

export async function createTempCart(sessionId: string) {
    const cartKey = `cart:session:${sessionId}`;
    const emptyCart = { items: [], created_at: new Date().toISOString() };
    await redis.set(cartKey, JSON.stringify(emptyCart), {
        EX: 60 * 60 * 2
      });
    return emptyCart;
}
export async function addItem(sessionId: string, productId: string, quantity: number) {
    const cartKey = `cart:session:${sessionId}`;
    let cart = await redis.get(cartKey);
  
    if (!cart) {
      cart = JSON.stringify({ items: [] });
    }
  
    const parsed = JSON.parse(cart);
  
    const existing = parsed.items.find((item: any) => item.product_id === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      parsed.items.push({ product_id: productId, quantity });
    }
  
    await redis.set(cartKey, JSON.stringify(parsed), {
        EX: 60 * 60 * 2
      });
    return parsed;
}
  

export async function getCart(sessionId: string) {
    const cartKey = `cart:session:${sessionId}`;
    const cart = await redis.get(cartKey);
    return cart ? JSON.parse(cart) : null;
}
export default createTempCart;