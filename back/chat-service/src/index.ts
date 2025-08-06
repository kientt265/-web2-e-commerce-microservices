import express from 'express';
import { Server } from 'socket.io';
import {producer, consumer } from './config/kafka';
import http from 'http';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import chatRoutes from './routes/chatRoutes';
import { initKafka } from './services/kafkaService';
import { handleSocketConnection } from './sockets/socketHandler';
config();

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const  io = new Server(server);
const port = process.env.CHAT_PORT || 3002;



handleSocketConnection(io);

app.use(express.json());
app.use('/', chatRoutes);
app.get('/run', (req, res) => {
  res.send('Chat Service is running');
});

server.listen(port, async () => {
  console.log(`Chat Service is running on port ${port}`);
  await initKafka(io);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down Chat Service...');
  await producer.disconnect();
  await consumer.disconnect();
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});