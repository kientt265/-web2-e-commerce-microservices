import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { tempCartController, persistentCartController } from '../controllers/cartControllers';

const router = Router();

// Temporary cart routes (no auth required)

router.post('/temp/add', tempCartController.addToCart);
router.delete('/temp/remove', tempCartController.removeFromCart);
router.get('/temp', tempCartController.getCartItems);

// Persistent cart routes (auth required)
router.use('/user', authMiddleware);
router.post('/user/cart', persistentCartController.createCart);
router.post('/user/cart/add', persistentCartController.addToCart);
router.delete('/user/cart/remove', persistentCartController.removeFromCart);
router.get('/user/cart/:userId', persistentCartController.getCart);
router.delete('/user/cart/:userId/clear', persistentCartController.clearCart);

export default router;