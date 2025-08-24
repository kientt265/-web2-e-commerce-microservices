import {getUrlPayment} from './vnpayService';
import { PrismaClient } from '@prisma/client';
import {producer} from '../config/kafka';

const prisma = new PrismaClient();

export const createPaymentService = async (order_id: number, amount: number) => {
    try {
        const payment = await prisma.payments.create({
            data: {
                order_id: order_id,
                amount: amount,
                payment_method: "e_wallet",
                status: "pending"
            }
        });
    
        const paymentUrl = getUrlPayment(amount, order_id.toString(), '0.0.0.0');
        const topic = 'payment-events';
        const message = {
            eventType: 'PAYMENT_SUCCESSFULLY',
            status: 'successfully',
            orderId: order_id,
            totalAmount: amount,
            errorMessage:'',
            createAt: new Date().toISOString()
        }
        await producer.send({
            topic,
            messages:[{value: JSON.stringify(message)}],
          });
        return ({ payment, paymentUrl})
    } catch (error: any) {
        const topic = 'payment-events';
        const message = {
            eventType: 'PAYMENT_FAILED',
            status: 'failed',
            orderId: order_id,
            totalAmount: amount,
            errorMessage: error.message,
            createAt: new Date().toISOString()
        }
        await producer.send({
            topic,
            messages:[{value: JSON.stringify(message)}],
        })
    }
}
//TODO: Cần viết gọn lại