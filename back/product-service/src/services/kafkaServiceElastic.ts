import { Kafka, Consumer, Producer, KafkaMessage } from 'kafkajs';
import { elasticsearchService } from './elasticsearchService';
import { PrismaClient } from '@prisma/client';

export class KafkaService {
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;
  private prisma: PrismaClient;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'product-service',
      brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.consumer = this.kafka.consumer({ groupId: 'product-service-group' });
    this.producer = this.kafka.producer();
    this.prisma = new PrismaClient();
  }

  // Khởi tạo Kafka consumer
  async initializeConsumer() {
    try {
      await this.consumer.connect();
      await this.producer.connect();

      // Subscribe to Debezium topics
      await this.consumer.subscribe({ 
        topic: 'product-db.public.products', 
        fromBeginning: true 
      });
      await this.consumer.subscribe({ 
        topic: 'product-db.public.categories', 
        fromBeginning: true 
      });

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          await this.handleMessage(topic, message);
        }
      });

      console.log('✅ Kafka consumer initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Kafka consumer:', error);
    }
  }

  // Xử lý message từ Kafka
  private async handleMessage(topic: string, message: KafkaMessage) {
    try {
      const value = JSON.parse(message.value?.toString() || '{}');
      
      if (topic === 'product-db.public.products') {
        await this.handleProductChange(value);
      } else if (topic === 'product-db.public.categories') {
        await this.handleCategoryChange(value);
      }
    } catch (error) {
      console.error('❌ Error handling Kafka message:', error);
    }
  }

  // Xử lý thay đổi sản phẩm
  private async handleProductChange(change: any) {
    const { before, after, op } = change.payload;

    try {
      switch (op) {
        case 'c': // Create
          if (after) {
            const product = await this.getProductWithCategory(after.id);
            if (product) {
              await elasticsearchService.indexProduct(product);
            }
          }
          break;

        case 'u': // Update
          if (after) {
            const product = await this.getProductWithCategory(after.id);
            if (product) {
              await elasticsearchService.updateProduct(product);
            }
          }
          break;

        case 'd': // Delete
          if (before) {
            await elasticsearchService.deleteProduct(before.id);
          }
          break;

        default:
          console.log(`Unknown operation: ${op}`);
      }
    } catch (error) {
      console.error('❌ Error handling product change:', error);
    }
  }

  // Xử lý thay đổi danh mục
  private async handleCategoryChange(change: any) {
    const { before, after, op } = change.payload;

    try {
      switch (op) {
        case 'u': // Update category name
          if (after) {
            // Cập nhật tất cả sản phẩm trong danh mục này
            const products = await this.prisma.products.findMany({
              where: { category_id: after.id },
              include: { categories: true }
            });

            for (const product of products) {
              await elasticsearchService.updateProduct(product);
            }
          }
          break;

        case 'd': // Delete category
          if (before) {
            // Xóa tất cả sản phẩm trong danh mục này khỏi index
            const products = await this.prisma.products.findMany({
              where: { category_id: before.id }
            });

            for (const product of products) {
              await elasticsearchService.deleteProduct(product.id);
            }
          }
          break;

        default:
          console.log(`Unknown category operation: ${op}`);
      }
    } catch (error) {
      console.error('❌ Error handling category change:', error);
    }
  }

  // Lấy sản phẩm với thông tin danh mục
  private async getProductWithCategory(productId: number) {
    try {
      return await this.prisma.products.findUnique({
        where: { id: productId },
        include: { categories: true }
      });
    } catch (error) {
      console.error(`❌ Error fetching product ${productId}:`, error);
      return null;
    }
  }

  // Gửi message đến Kafka
  async sendMessage(topic: string, message: any) {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            value: JSON.stringify(message)
          }
        ]
      });
      console.log(`✅ Message sent to topic: ${topic}`);
    } catch (error) {
      console.error(`❌ Error sending message to topic ${topic}:`, error);
    }
  }

  // Đóng kết nối
  async disconnect() {
    try {
      await this.consumer.disconnect();
      await this.producer.disconnect();
      await this.prisma.$disconnect();
      console.log('✅ Kafka connections closed');
    } catch (error) {
      console.error('❌ Error disconnecting Kafka:', error);
    }
  }

  // Khởi tạo dữ liệu ban đầu
  async initializeData() {
    try {
      console.log('🔄 Initializing Elasticsearch with existing data...');
      
      const products = await this.prisma.products.findMany({
        include: { categories: true }
      });

      if (products.length > 0) {
        await elasticsearchService.bulkIndexProducts(products);
        console.log(`✅ Initialized ${products.length} products in Elasticsearch`);
      } else {
        console.log('ℹ️ No products found to initialize');
      }
    } catch (error) {
      console.error('❌ Error initializing data:', error);
    }
  }
}

export const kafkaService = new KafkaService(); 