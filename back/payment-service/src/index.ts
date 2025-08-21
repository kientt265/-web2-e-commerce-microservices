import express from "express";
import cors from "cors";
import { config } from 'dotenv';
import paymentRoute from './routes/paymentRoute';
config();

const app = express();
const port = process.env.PAYMENT_PORT || 3006;
app.use(cors());
app.use(express.json());
app.use('/', paymentRoute);
app.get('/run', (req, res) => {
  res.send('Product Service is running');
});

app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});