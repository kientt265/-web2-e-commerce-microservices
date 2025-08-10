import express from 'express';
import { config } from 'dotenv';
import productRoutes from './routes/productRoute';
import { elasticsearchService } from './services/elasticsearchService';
import { kafkaService } from './services/kafkaService';

config();

const app = express();
const PORT = process.env.PRODUCT_PORT || 3003;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const esHealth = await elasticsearchService.healthCheck();
    
    res.json({ 
      status: 'OK', 
      service: 'Product Service',
      timestamp: new Date().toISOString(),
      elasticsearch: esHealth,
      kafka: 'Connected'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'ERROR',
      service: 'Product Service',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API Routes
app.use('/api/v1', productRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize services and start server
async function startServer() {
  try {
    // Initialize Elasticsearch
    console.log('🔄 Initializing Elasticsearch...');
    await elasticsearchService.initializeIndex();
    
    // Initialize Kafka consumer
    console.log('🔄 Initializing Kafka consumer...');
    await kafkaService.initializeConsumer();
    
    // Initialize existing data
    console.log('🔄 Initializing existing data...');
    await kafkaService.initializeData();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Product Service running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/v1`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔍 Search API: http://localhost:${PORT}/api/v1/search/products`);
      console.log(`💡 Suggestions API: http://localhost:${PORT}/api/v1/suggest/products`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down gracefully...');
  await kafkaService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  await kafkaService.disconnect();
  process.exit(0);
});

startServer();
