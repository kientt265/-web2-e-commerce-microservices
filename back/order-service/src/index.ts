import express from 'express';
import { config } from 'dotenv';
import cors from 'cors';
config();
const app = express();
const port = process.env.PRODUCT_PORT || 3005;

app.use(cors());
app.use(express.json());

app.get('/run', (req, res) => {
    res.send('Product Service is running');
});

app.use('*', (req: express.Request, res: express.Response) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(port, async () => {
    console.log(`Order Service is running on port ${port}`);
  });