import express from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import http from 'http';
import orderRoutes from './routes/orderRoutes';
import { initKafka } from './services/kafkaService';
import {producer, consumer} from './config/kafka';
config();
const app = express();
const server = http.createServer(app);
const port = process.env.PRODUCT_PORT || 3005;

app.use(cors());
app.use(express.json());
app.use('/', orderRoutes);
app.get('/run', (req, res) => {
    res.send('Order Service is running');
});

server.listen(port, async () => {
    console.log('\n=== Order Service Status ===');
    console.log(`[Server] 🚀 HTTP Server running on port ${port}`);
    try {
        await initKafka();
        console.log('[Service] ✅ Order service fully initialized\n');
    } catch (error) {
        console.error('[Service] ❌ Failed to initialize Kafka:', error);
        process.exit(1);
    }
})
process.on('SIGTERM', async () => {
    console.log('\n=== Shutting down Chat Service ===');
    console.log('[Service] 🛑 Received SIGTERM signal');
    
    try {
        await producer.disconnect();
        console.log('[Kafka] ✅ Producer disconnected');
        
        await consumer.disconnect();
        console.log('[Kafka] ✅ Consumer disconnected');
        

        server.close(() => {
            console.log('[Server] ✅ HTTP Server closed');
            console.log('[Service] 👋 Goodbye!\n');
            process.exit(0);
        });
    } catch (error) {
        console.error('[Service] ❌ Error during shutdown:', error);
        process.exit(1);
    }
});

app.use('*', (req: express.Request, res: express.Response) => {
    res.status(404).json({ error: 'Route not found' });
});

