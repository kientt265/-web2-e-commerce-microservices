import express from 'express';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes';

config();

const prisma = new PrismaClient();
const app = express();
const port = process.env.AUTH_PORT || 3001;

app.use(express.json());
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => {
  res.send('Auth Service is running');
});

app.listen(port, async () => {
  console.log(`Auth Service is running on port ${port}`);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down Auth Service...');
  await prisma.$disconnect();
  process.exit(0);
});