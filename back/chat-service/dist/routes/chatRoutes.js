"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatController_1 = require("../controllers/chatController");
const router = (0, express_1.Router)();
router.get('/messages/:conversation_id', chatController_1.getMessages);
router.post('/conversation', chatController_1.createConversation);
router.post('/messages', chatController_1.sendMessage);
exports.default = router;
