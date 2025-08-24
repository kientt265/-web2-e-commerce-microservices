import e, { NextFunction, Request, Response } from "express";
import { getUrlPayment } from "../services/vnpayService";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createPaymentController = async (req: Request, res: Response) => {
   try {
        const { order_id, amount } = req.body;
        
        if (!order_id || !amount) {
            return res.status(400).json({ error: 'Missing required fields: order_id or amount' });
        }

        const userIp = req.ip;
        if (!userIp) {
            return res.status(400).json({ error: 'Cannot determine user IP' });
        }

        const payment = await prisma.payments.create({
            data: {
                order_id: Number(order_id),
                amount: Number(amount),
                payment_method: "e_wallet",
                status: "pending"
            }
        });

        const paymentUrl = getUrlPayment(amount, order_id.toString(), userIp);

        return res.status(200).json({
            payment_id: payment.id,
            payment_url: paymentUrl
        });

   } catch (error) {
        console.error('Payment creation error:', error);
        return res.status(500).json({ error: 'Failed to create payment' });
   }
}

export const testReturnURL = async (req: Request, res: Response) => {
    try {
        console.log(req.query);
        //TODO: VIết URL sau khi payment thành công
        // {
        //     vnp_Amount: '5000000',
        //     vnp_BankCode: 'NCB',
        //     vnp_BankTranNo: 'VNP15145887',         
        //     vnp_CardType: 'ATM',         
        //     vnp_OrderInfo: 'Thanh toán đơn hàng 000003',       
        //     vnp_PayDate: '20250825012746',     
        //     vnp_ResponseCode: '00',   
        //     vnp_TmnCode: '0Z77ZM27',  
        //     vnp_TransactionNo: '15145887',
        //     vnp_TransactionStatus: '00',
        //     vnp_TxnRef: '000003',
        //     vnp_SecureHash: '25db5e592e2a5cf53e957093ef06490f94c03906a0a2e6e962a137f9579c6d433f2c0c3d5742bb4bf6ffab9f2df42c0ad3cfa317b3bc10eda26bca059f99eb72'
        //   }
    } catch(error) {
        res.status(500).json(error);
    }
}

// export const handlePaymentCallbackController = async (req: Request, res: Response, next: NextFunction) => {
//     try {

//         const result = await handlePaymentCallback(req.query as ReturnQueryFromVNPay);
//         res.status(200).json(result);
//     } catch (error) {
//         next(error);
//     }

// }

// export const checkStatusPayment = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const payment = await prisma.payments.findFirst({
//             where: { order_id: parseInt(req.params.orderId) }
//         });
//         if (!payment) {
//             return res.status(404).json({ error: 'Payment not found' });
//         }
//         res.status(200).json({ status: payment.status });
//     } catch (error) {
//         res.status(400).json(error);
//     }
// }