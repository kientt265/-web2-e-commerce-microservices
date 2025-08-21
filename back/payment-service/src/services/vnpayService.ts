

import { ReturnQueryFromVNPay, VNPay, ignoreLogger } from 'vnpay';
import { Request } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const vnpay = new VNPay({
    // ⚡ Cấu hình bắt buộc
    tmnCode: process.env.TMNCODE as string,
    secureSecret: process.env.SECURESECRET_PAYMENT as string,
    vnpayHost: 'https://sandbox.vnpayment.vn',
    
    // 🔧 Cấu hình tùy chọn
    testMode: true,                     // Chế độ test ,           // Thuật toán mã hóa
    enableLog: true,                   // Bật/tắt log
    loggerFn: ignoreLogger,            // Custom logger
    
    // 🔧 Custom endpoints
    endpoints: {
        paymentEndpoint: 'paymentv2/vpcpay.html',
        queryDrRefundEndpoint: 'merchant_webapi/api/transaction',
        getBankListEndpoint: 'qrpayauth/api/merchant/get_bank_list',
    }
});
export const getUrlPayment = (totalAmount: number, idOrder: string, ipAddr: string) => {
    const paymentUrl = vnpay.buildPaymentUrl({
        vnp_Amount: totalAmount,  
        vnp_IpAddr: ipAddr,
        vnp_ReturnUrl: 'http://payment-service:3006/vnpay/callback',
        vnp_TxnRef: idOrder,
        vnp_OrderInfo: `Thanh toán đơn hàng ${idOrder}`,
    });
    console.log('Payment URL:', paymentUrl);
    return paymentUrl;
}


export const verifyUrlReturn = (req: Request) => {
    const verify = vnpay.verifyReturnUrl(req.query as ReturnQueryFromVNPay);
    if (verify.isSuccess) {
        console.log('✅ Thanh toán thành công!', verify.message);
    } else {
        console.log('❌ Thanh toán thất bại:', verify.message);
    }
}


export const handlePaymentCallback = async (query: ReturnQueryFromVNPay, orderId: number) => {
    const verify = vnpay.verifyReturnUrl(query);
    
    // if (!verify.vnp_TxnRef) {
    //     throw new Error('Không tìm thấy mã đơn hàng');
    // }

    // const orderId = verify.vnp_TxnRef;
    
    try {
        if (verify.isSuccess) {

            await prisma.payments.update({
                where: {
                    id: orderId
                },
                data: {
                    status: 'completed'
                }
            });

            await axios.patch(`http://order-service:3005/orders/${orderId}/status`, {
                status: 'processing'
            });

            return {
                success: true,
                message: 'Thanh toán thành công'
            };
        } else {

            await prisma.payments.update({
                where: {
                    id: orderId
                },
                data: {
                    status: 'failed',
                    payment_details: verify
                }
            });

            await axios.patch(`http://order-service:3005/orders/${orderId}/status`, {
                status: 'cancelled'
            });

            return {
                success: false,
                message: 'Thanh toán thất bại: ' + verify.message
            };
        }
    } catch (error) {
        console.error('Lỗi xử lý callback thanh toán:', error);
        throw error;
    }
}