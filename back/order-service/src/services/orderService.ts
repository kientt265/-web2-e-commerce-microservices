import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import type {Cart, CartItem, Product} from '../types';
const prisma = new PrismaClient();

export const orderService = {
  createOrder: async (userId: string, cartId: number, shippingAddress: string) => {
    //check cart
    const cartResponse = await axios.get<Cart>(`http://cart-service:3004/api/cart/user/cart/${userId}`);
    const cart = cartResponse.data;

    if (!cart) {
      throw new Error('Cart is empty');
    }
    //check inventory
    const productChecks = await Promise.all(
      cart.cart_items.map(
        async (item: CartItem) => {
        const productResponse = await axios.get<Product>(`http://product-service:3003/products/${item.product_id}`);
        return {
          product: productResponse.data,
          quantity: item.quantity
        };
      })
    );

    for (const check of productChecks) {
      if (check.product.stock < check.quantity) {
        throw new Error(`Insufficient stock for product ${check.product.name}`);
      }
    }

    const order = await prisma.$transaction(async (tx: any) => {
      const order = await tx.orders.create({
        data: {
          user_id: userId,
          status: 'pending',
          shipping_address: shippingAddress,
          total_amount: cart.cart_items.reduce(
            (total: number, item: any) => total + item.price_at_added * item.quantity,
            0
          )
        }
      });

      await tx.order_items.createMany({
        data: cart.cart_items.map((item: CartItem) => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_time: item.price_at_added
        }))
      });

      return order;
    });

    await Promise.all(
      cart.cart_items.map((item: CartItem) =>
        axios.patch(`http://product-service:3003/products/${item.product_id}/stock`, {
          quantity: -item.quantity
        })
      )
    );

    await axios.delete(`http://cart-service:3004/api/cart/user/cart/${userId}/clear`);

    await axios.post('http://payment-service:3006/payments', {
      order_id: order.id,
      amount: order.total_amount
    });

    return order;
  },
///////////////NOT CHECK ORTHER API SERVICE///////////////////////////
  getOrderById: async (orderId: string) => {
    return prisma.orders.findUnique({
      where: { id: Number(orderId) },
      include: {
        order_items: true
      }
    });
  },

  getUserOrders: async (userId: string, page: number, limit: number) => {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where: { user_id: userId },
        include: {
          order_items: true
        },
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc'
        }
      }),
      prisma.orders.count({
        where: { user_id: userId }
      })
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    return prisma.orders.update({
      where: { id: Number(orderId) },
      data: { 
        status,
        updated_at: new Date()
      }
    });
  },

  cancelOrder: async (orderId: string) => {
    const order = await prisma.orders.findUnique({
      where: { id: Number(orderId) },
      include: {
        order_items: true
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'pending') {
      throw new Error('Can only cancel pending orders');
    }

    // 1. Cập nhật trạng thái đơn hàng
    const updatedOrder = await prisma.orders.update({
      where: { id: Number(orderId) },
      data: {
        status: 'cancelled',
        updated_at: new Date()
      }
    });

    // 2. Hoàn lại số lượng tồn kho
    await Promise.all(
      order.order_items.map((item: any) =>
        axios.patch(`http://product-service:3003/products/${item.product_id}/stock`, {
          quantity: item.quantity
        })
      )
    );

    // 3. Tạo yêu cầu hoàn tiền
    await axios.post('http://payment-service:3006/refunds', {
      order_id: orderId,
      amount: order.total_amount
    });

    return updatedOrder;
  }
};