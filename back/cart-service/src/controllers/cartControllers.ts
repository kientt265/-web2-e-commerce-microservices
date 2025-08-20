import { Request, Response } from 'express';
import { addItem, getCart, createTempCart } from '../services/tempCart';
import { cartService } from '../services/cartService';

// Temporary cart controllers
export const tempCartController = {
  addToCart: async (req: Request, res: Response) => {
    try {
      const sessionId = (req as any).sessionId; 
      const { productId, quantity } = req.body;
      
      if (!sessionId || !productId || !quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const cart = await addItem(sessionId, productId, quantity);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add item to cart' });
    }
  },

  removeFromCart: async (req: Request, res: Response) => {
    try {
      const sessionId = (req as any).sessionId;
      const { productId } = req.body;
      
      if (!sessionId || !productId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const cart = await addItem(sessionId, productId, 0);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove item from cart' });
    }
  },

  getCartItems: async (req: Request, res: Response) => {
    try {
      const sessionId = (req as any).sessionId;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const cart = await getCart(sessionId as string);
      if (!cart) {
        const newCart = await createTempCart(sessionId as string);
        return res.json(newCart);
      }
      
      res.json(cart);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get cart items' });
    }
  }
};

// Persistent cart controllers
export const persistentCartController = {
  createCart: async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const cart = await cartService.createCart(userId);
      res.json(cart);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create cart' });
    }
  },

  addToCart: async (req: Request, res: Response) => {
    try {
      const { userId, productId, quantity, price } = req.body;

      if (!userId || !productId || !quantity || !price) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const cart = await cartService.addToCart(userId, productId, quantity, price);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add item to cart' });
    }
  },

  removeFromCart: async (req: Request, res: Response) => {
    try {
      const { userId, productId } = req.body;

      if (!userId || !productId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const cart = await cartService.removeFromCart(userId, productId);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove item from cart' });
    }
  },

  getCart: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const cart = await cartService.getCart(userId);
      res.json(cart || { items: [] });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get cart' });
    }
  },

  clearCart: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const cart = await cartService.clearCart(userId);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear cart' });
    }
  }
};

