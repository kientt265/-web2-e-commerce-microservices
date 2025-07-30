import {Router} from 'express';
import { get } from 'http';
import { getMessages, createConversation } from '../controllers/chatController';
const router = Router();


router.get('/messages/:conservationId', getMessages);
router.post('/conservation', createConversation);

export default router;