

import { ReturnQueryFromVNPay, VNPay, ignoreLogger } from 'vnpay';
import { Request } from 'express';

const vnpay = new VNPay({
    // ⚡ Cấu hình bắt buộc
    tmnCode: '0Z77ZM27',
    secureSecret: 'LK2W9JGCQ07KX1GKYZMLIMIGA4UXZ7QV',
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
        vnp_ReturnUrl: 'http://localhost:3006/return',
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


