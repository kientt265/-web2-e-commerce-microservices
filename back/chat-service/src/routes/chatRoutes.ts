import {Router} from 'express';
import { getMessages, createConversation, sendMessage } from '../controllers/chatController';
const router = Router();

router.get('/messages/:conversation_id', getMessages);
router.post('/conversation', createConversation);
router.post('/messages', sendMessage);

export default router;