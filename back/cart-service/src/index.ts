import express from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import { connectRedis } from './config/redis';
import cartRoutes from './routes/cartRoutes';
import {ensureSession} from './middleware/session';
config();

const app = express();
const port = process.env.CART_PORT || 3004;

(async () => {
  await connectRedis();
})();

app.use(cors());
app.use(express.json());

app.use(ensureSession);

app.get('/run', (req, res) => {
  res.send('Cart Service is running');
});


app.use('/api/cart', cartRoutes);


app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(port, async () => {
  console.log(`Cart Service is running on port ${port}`);
});