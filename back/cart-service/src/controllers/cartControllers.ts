import { Request, Response } from 'express';
import { addItem, getCart, createTempCart } from '../services/tempCart';

export const addToCart = async (req: Request, res: Response) => {
  try {
    const { sessionId, productId, quantity } = req.body;
    
    if (!sessionId || !productId || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cart = await addItem(sessionId, productId, quantity);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
};

export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const { sessionId, productId } = req.body;
    
    if (!sessionId || !productId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cart = await addItem(sessionId, productId, 0); // Quantity 0 to remove
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
};

export const getCartItems = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.query;
    
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
};

