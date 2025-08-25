//TODO: 2 Cập nhật README. Thêm mail service
//TODO: 3 Xong 2 TODO này thì viết tiếp E2EE cho chat-app
//TODO: 4 Viết lại summary CV
import {config} from 'dotenv';
config();
import express from 'express';
import cors from 'cors';
import http from 'http';
import mailRoute from  './routes/mailRoute';
import { initKafka } from './services/kafkaService';
import {producer, consumer} from './config/kafka';



const app = express();
const server = http.createServer(app);
const port = process.env.MAIL_PORT || 3007;
app.use(express.json());
app.use('/', mailRoute);
app.get('/run', (req, res) => {
    res.send('Mail Service is running');
})

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

