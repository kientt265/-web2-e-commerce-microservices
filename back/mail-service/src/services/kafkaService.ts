import {producer, consumer} from '../config/kafka';
import {sendMailUserService} from './mailService';
export async function initKafka() {
    try{
        await producer.connect();
        console.log('[Kafka] ✅ Producer connected successfully');

        await consumer.connect();
        console.log('[Kafka] ✅ Consumer connected successfully');

        await consumer.subscribe({topic: 'order-events', fromBeginning: true});
        console.log('[Kafka] 📥 Subscribed to order-event topic');

        await consumer.run({
            eachMessage: async ({topic, partition, message}) => {
                const msg = JSON.parse(message.value?.toString() || '{}');
                console.log(`[Kafka] 📨 Received message on topic "${topic}":`);
                switch(msg.eventType) {
                    case "ORDER_CREATED":
                    //TODO: Call API get email by user
                    const res = await sendMailUserService(msg.email, msg.order_id, msg.customer_name);
                      break;
                    case "**":
                      // update order = "cancelled"
                      break;
                    case "**":
                      // log error, retry, alert...
                      break;
                  }
            }
        })
    } catch (error) {
        console.error('[Kafka] ❌ Error initializing Kafka:', error);
        throw error;
    }
}