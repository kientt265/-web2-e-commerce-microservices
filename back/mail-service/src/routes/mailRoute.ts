import { Router } from "express";
import {sendMailUserController} from '../controllers/mailController';

const router = Router();
router.post('/sendMail', sendMailUserController);

export default router;

