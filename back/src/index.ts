
import express from 'express';
import { Server } from 'socket.io';
import { Kafka } from 'kafkajs';
import http from 'http';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import chatRoutes from './routes/chatRoutes'; // Import your chat routes if needed
import authRoutes from './routes/authRoutes'; // Import your auth routes if needed
config();

const prisma = new PrismaClient();
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
        } catch (error) {
          console.error('Error processing Kafka message:', error);
        }
      },
    });
  } catch (error) {
    console.error('Error initializing Kafka:', error);
  }
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
    try {
      const message = {
        message_id: randomUUID(), // Sử dụng UUID thay vì random
        ...data,
        sent_at: new Date().toISOString(),
      };

      // Đẩy tin nhắn vào Kafka
      await producer.send({
        topic: 'chat-messages',
        messages: [{ value: JSON.stringify(message) }],
      });

      console.log('Message sent to Kafka:', message);
    } catch (error) {
      console.error('Error sending message to Kafka:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.use(express.json());
app.use('/api', chatRoutes);
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => {
  res.send('Chat Service is running');
});

// Khởi động server
server.listen(port, async () => {
  console.log(`Chat Service is running on port ${port}`);
  await initKafka();
});

// Xử lý graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await producer.disconnect();
  await consumer.disconnect();
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});