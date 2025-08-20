import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  cancelOrder
} from '../controllers/orderController';

const router = Router();

router.use(authMiddleware);

router.post('/orders', createOrder);
router.get('/orders/:id', getOrderById);
router.get('/orders/user/:userId', getUserOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/cancel', cancelOrder);

export default router;