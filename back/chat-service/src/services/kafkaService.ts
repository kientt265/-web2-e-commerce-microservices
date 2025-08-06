import {producer, consumer } from '../config/kafka';
import {Server} from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export async function initKafka(io: Server) {
    await producer.connect();
    console.log('Kafka Producer connected');
    await consumer.connect();
    console.log('Kafka Consumer connected');
    await consumer.subscribe({ topic: 'private-chat-messages', fromBeginning: true });
    await consumer.subscribe({topic: 'group-chat-messages', fromBeginning: true});
    await consumer.run({
        eachMessage: async ({topic, partition, message}) => {
            try {
                const msg = JSON.parse(message.value?.toString() || '{}');
                console.log('Received Kafka message:', msg);

                io.to(msg.conversation_id).emit('new_message', msg);

                await prisma.messages.create({
                    data: {
                        message_id: msg.message_id,
                        conversation_id: msg.conversation_id,
                        sender_id: msg.sender_id,
                        content: msg.content,
                        sent_at: new Date(msg.sent_at),
                        is_read: false,
                    },
                });
            } catch (error) {
                console.error('Error processing Kafka message:', error);
            }
        }
    })
}