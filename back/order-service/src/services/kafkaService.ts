import { producer, consumer } from '../config/kafka';
export async function initKafka() {
    try {
        await producer.connect();
        console.log('[Kafka] ✅ Producer connected successfully');

        await consumer.connect();
        console.log('[Kafka] ✅ Consumer connected successfully');

        await consumer.subscribe({ topic: 'product-events', fromBeginning: true });
        console.log('[Kafka] 📥 Subscribed to product-event topic');

        await consumer.subscribe({ topic: 'payment-events', fromBeginning: true });
        console.log('[Kafka] 📥 Subscribed to payment-event topic');

        await consumer.run({
            eachMessage: async ({topic, partition, message}) => {
                try {
                    const msg = JSON.parse(message.value?.toString() || '{}');
                    console.log(`[Kafka] 📨 Received message on topic "${topic}":`);
                    switch(msg.eventType) {
                        case "PRODUCT_RESERVED":
                          // update order = "pending_payment"
                          break;
                        case "PRODUCT_OUT_OF_STOCK":
                          // update order = "cancelled"
                          break;
                        case "PRODUCT_ERROR":
                          // log error, retry, alert...
                          break;
                      }
                      
                } catch (error) {
                    console.error('[Kafka] ❌ Error processing message:', error);
                }
            }
        });
    } catch (error) {
        console.error('[Kafka] ❌ Error initializing Kafka:', error);
        throw error;
    }
    
}