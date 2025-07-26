
import express from 'express';
import { Server } from 'socket.io';
import { Kafka } from 'kafkajs';
import http from 'http';
import { config } from 'dotenv';

config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

// Cấu hình Kafka
const kafka = new Kafka({
  clientId: 'chat-service',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
});
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
  socket.on('join_conversation', (conversationId: string) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });

  // Client gửi tin nhắn
  socket.on('send_message', async (data: { conversation_id: string; sender_id: string; content: string }) => {
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

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Chat Service is running');
});

server.listen(port, async () => {
  console.log(`Chat Service is running on port ${port}`);
  await initKafka();
});
