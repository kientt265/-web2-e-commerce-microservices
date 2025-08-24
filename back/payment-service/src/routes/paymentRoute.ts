import { Router } from "express";
// import { createPaymentController, handlePaymentCallbackController, checkStatusPayment } from "../controllers/paymentController";

import { createPaymentController, testReturnURL} from "../controllers/paymentController";


const router = Router();


router.post('/payments', createPaymentController);
router.get('/return',testReturnURL );
// router.get('/vnpay/callback', handlePaymentCallbackController);

// router.get('/payments/:orderId/status', checkStatusPayment)


export default router;