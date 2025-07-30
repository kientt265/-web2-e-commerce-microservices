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
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
const port = process.env.PORT || 3000;
// Cấu hình Kafka
const kafka = new kafkajs_1.Kafka({
    clientId: 'chat-service',
    brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
});
// export class Kafka {
//   constructor(config: KafkaConfig)
//   producer(config?: ProducerConfig): Producer
//   consumer(config: ConsumerConfig): Consumer
//   admin(config?: AdminConfig): Admin
//   logger(): Logger
// }
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'chat-group' });
// Kết nối Kafka
async function initKafka() {
    await producer.connect();
    await consumer.connect();
    await consumer.subscribe({ topic: 'chat-messages', fromBeginning: true });
    // Xử lý tin nhắn từ Kafka
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const msg = JSON.parse(message.value?.toString() || '{}');
            io.to(msg.conversation_id).emit('new_message', msg); // Gửi tin nhắn đến client qua Socket.IO
        },
    });
}
// Socket.IO: Xử lý kết nối từ client
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    // Client tham gia cuộc trò chuyện
    socket.on('join_conversation', (conversationId) => {
        socket.join(conversationId);
        console.log(`User ${socket.id} joined conversation ${conversationId}`);
    });
    // Client gửi tin nhắn
    socket.on('send_message', async (data) => {
        const message = {
            message_id: Math.random().toString(36).substring(2), // Thay bằng UUID trong thực tế
            ...data,
            sent_at: new Date().toISOString(),
        };
        // Đẩy tin nhắn vào Kafka
        await producer.send({
            topic: 'chat-messages',
            messages: [{ value: JSON.stringify(message) }],
        });
        // Lưu tin nhắn vào PostgreSQL (sẽ thêm sau)
    });
});
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('Chat Service is running');
});
server.listen(port, async () => {
    console.log(`Chat Service is running on port ${port}`);
    await initKafka();
});
