import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const cartService = {
  async createCart(userId: string) {
    return await prisma.carts.create({
      data: {
        user_id: userId
      },
      include: {
        cart_items: true
      }
    });
  },

  async getCart(userId: string) {
    return await prisma.carts.findFirst({
      where: { user_id: userId },
      include: {
        cart_items: true
      }
    });
  },

  async addToCart(userId: string, productId: number, quantity: number, price: number) {
    const cart = await prisma.carts.findFirst({
      where: { user_id: userId },
      include: {
        cart_items: true
      }
    });

    if (!cart) {
      return await prisma.carts.create({
        data: {
          user_id: userId,
          cart_items: {
            create: [{
              product_id: productId,
              quantity,
              price_at_added: price
            }]
          }
        },
        include: {
          cart_items: true
        }
      });
    }

    const existingItem = cart.cart_items.find(item => item.product_id === productId);

    if (existingItem) {
      return await prisma.carts.update({
        where: { id: cart.id },
        data: {
          updated_at: new Date(),
          cart_items: {
            update: {
              where: { id: existingItem.id },
              data: { 
                quantity: existingItem.quantity + quantity,
                updated_at: new Date()
              }
            }
          }
        },
        include: {
          cart_items: true
        }
      });
    }

    return await prisma.carts.update({
      where: { id: cart.id },
      data: {
        updated_at: new Date(),
        cart_items: {
          create: [{ 
            product_id: productId, 
            quantity,
            price_at_added: price
          }]
        }
      },
      include: {
        cart_items: true
      }
    });
  },

  async removeFromCart(userId: string, productId: number) {
    const cart = await prisma.carts.findFirst({
      where: { user_id: userId },
      include: {
        cart_items: true
      }
    });

    if (!cart) return null;

    const item = cart.cart_items.find(item => item.product_id === productId);
    if (!item) return cart;

    return await prisma.carts.update({
      where: { id: cart.id },
      data: {
        updated_at: new Date(),
        cart_items: {
          delete: { id: item.id }
        }
      },
      include: {
        cart_items: true
      }
    });
  },

  async clearCart(userId: string) {
    const cart = await prisma.carts.findFirst({
      where: { user_id: userId }
    });

    if (!cart) return null;

    return await prisma.carts.update({
      where: { id: cart.id },
      data: {
        updated_at: new Date(),
        cart_items: {
          deleteMany: {}
        }
      },
      include: {
        cart_items: true
      }
    });
  }
};

export default cartService;