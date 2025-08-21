import { NextFunction, Request, Response } from "express";
import { getUrlPayment, handlePaymentCallback } from "../services/vnpayService";
import { PrismaClient } from "@prisma/client";
import { ReturnQueryFromVNPay, VNPay, ignoreLogger } from 'vnpay';
const prisma = new PrismaClient();

export const createPaymentController = async (req: Request, res: Response) => {
   try {
        const { order_id, amount } = req.body;
        
        if (!order_id || !amount) {
            return res.status(400).json({ error: 'Missing required fields: order_id or amount' });
        }

        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const userIp = req.ip;
        if (!userIp) {
            return res.status(400).json({ error: 'Cannot determine user IP' });
        }

        const payment = await prisma.payments.create({
            data: {
                order_id: order_id,
                amount: amount,
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
        // if (error.code === 'P2002') {
        //     return res.status(400).json({ error: 'Payment already exists for this order' });
        // }
        return res.status(500).json({ error: 'Failed to create payment' });
   }
}

export const handlePaymentCallbackController = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const result = await handlePaymentCallback(req.query as ReturnQueryFromVNPay);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }

}

export const checkStatusPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payment = await prisma.payments.findFirst({
            where: { order_id: parseInt(req.params.orderId) }
        });
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        res.status(200).json({ status: payment.status });
    } catch (error) {
        res.status(400).json(error);
    }
}