import { Router } from "express";
import { createPaymentController, handlePaymentCallbackController, checkStatusPayment } from "../controllers/paymentController";


const router = Router();

// Middleware xử lý lỗi
// const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
//     console.error(err.stack);
//     res.status(500).json({ error: 'Something went wrong!' });
// };

router.post('/payments', createPaymentController);
router.get('/vnpay/callback', handlePaymentCallbackController);

router.get('/payments/:orderId/status', checkStatusPayment)


// router.use(errorHandler);

export default router;