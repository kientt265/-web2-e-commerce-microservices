"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const kafkajs_1 = require("kafkajs");
const http_1 = __importDefault(require("http"));
const dotenv_1 = require("dotenv");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const authSocket_1 = require("../middleware/authSocket");
(0, dotenv_1.config)();
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
const port = process.env.CHAT_PORT || 3002;
// Cấu hình Kafka
const kafka = new kafkajs_1.Kafka({
    clientId: 'chat-service',
    brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
});
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'chat-group' });
// Kết nối Kafka
async function initKafka() {
    try {
        await producer.connect();
        console.log('Kafka Producer connected');
        await consumer.connect();
        console.log('Kafka Consumer connected');
        await consumer.subscribe({ topic: 'chat-messages', fromBeginning: true });
        // Xử lý tin nhắn từ Kafka
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const msg = JSON.parse(message.value?.toString() || '{}');
                    console.log('Received Kafka message:', msg);
                    // Gửi tin nhắn đến các client trong phòng (conversation)
                    io.to(msg.conversation_id).emit('new_message', msg);
                    // Lưu tin nhắn vào PostgreSQL
                    await prisma.messages.create({
                        data: {
                            message_id: msg.message_id,
                            conversation_id: msg.conversation_id,
                            sender_id: msg.sender_id,
                            content: msg.content,
                            sent_at: new Date(msg.sent_at),
                            is_read: false,
                        },
                    });
                }
                catch (error) {
                    console.error('Error processing Kafka message:', error);
                }
            },
        });
    }
    catch (error) {
        console.error('Error initializing Kafka:', error);
    }
}
// Socket.IO: Xử lý kết nối từ client
io.use(authSocket_1.authSocket).on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    // Client tham gia cuộc trò chuyện
    socket.on('join_conversation', (conversationId) => {
        socket.join(conversationId);
        console.log(`User ${socket.id} joined conversation ${conversationId}`);
    });
    // Client gửi tin nhắn
    socket.on('send_message', async (data) => {
        try {
            const message = {
                message_id: (0, crypto_1.randomUUID)(),
                ...data,
                sent_at: new Date().toISOString(),
            };
            // Đẩy tin nhắn vào Kafka
            await producer.send({
                topic: 'chat-messages',
                messages: [{ value: JSON.stringify(message) }],
            });
            console.log('Message sent to Kafka:', message);
        }
        catch (error) {
            console.error('Error sending message to Kafka:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
app.use(express_1.default.json());
app.use('/api', chatRoutes_1.default);
app.get('/', (req, res) => {
    res.send('Chat Service is running');
});
server.listen(port, async () => {
    console.log(`Chat Service is running on port ${port}`);
    await initKafka();
});
process.on('SIGTERM', async () => {
    console.log('Shutting down Chat Service...');
    await producer.disconnect();
    await consumer.disconnect();
    await prisma.$disconnect();
    server.close(() => process.exit(0));
});
