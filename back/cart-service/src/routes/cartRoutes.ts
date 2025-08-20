import { Router} from 'express';
import { authMiddleware } from '../middleware/auth';
import { addToCart, removeFromCart, getCartItems } from '../controllers/cartControllers';

const router = Router();

router.post('/add', addToCart);
router.delete('/remove', removeFromCart);
router.get('/', getCartItems);
router.use(authMiddleware);

export default router;