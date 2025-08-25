import { Request, Response } from "express";
import {sendMailUserService} from '../services/mailService';

export const sendMailUserController = async (req: Request, res: Response) => {
    try {
        const {user_email, order_id, customer_name} = req.body;
        const result = sendMailUserService(user_email, order_id, customer_name);
        console.log(`status email ${result}`)
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json(error);
    }
}