import { Router } from 'express';
import { getMessages, createConversation, sendMessage, getAllConversations } from '../controllers/chatController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware); 

router.get('/messages/:conversation_id', getMessages);
router.post('/conversation', createConversation);
router.post('/messages', sendMessage);
router.get('/conversations', getAllConversations);

export default router;