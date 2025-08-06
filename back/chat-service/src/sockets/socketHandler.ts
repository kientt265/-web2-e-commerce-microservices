import { PrismaClient } from "@prisma/client";
import {producer} from '../config/kafka';
import { Server } from "socket.io";
import { randomUUID } from "crypto";
import { authSocket } from "../middleware/authSocket";
const prisma = new PrismaClient();

export const handleSocketConnection = (io: Server) => {
    io.use(authSocket).on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('join_conversation', (conversationId: string) => {
            socket.join(conversationId);
            console.log(`User ${socket.id} joined conversation ${conversationId}`);
        });

        socket.on('send_message', async (data: { conversation_id: string; sender_id: string; content: string }) => {
            try {

                if (!data.conversation_id || !data.sender_id || !data.content) {
                    throw new Error('Missing required fields');
                }

                const conversation = await prisma.conversations.findUnique({
                    where: { conversation_id: data.conversation_id },
                    select: { type: true },
                });

                if (!conversation) {
                    throw new Error('Conversation not found');
                }
                const message = {
                    message_id: randomUUID(),
                    ...data,
                    sent_at: new Date().toISOString(),
                };

                const topic = conversation?.type === 'group' ? 'group-chat-messages' : 'private-chat-messages';
                await producer.send({
                    topic,
                    messages: [{ value: JSON.stringify(message) }],
                });

                console.log('Message sent to Kafka:', message);
            } catch (error) {
                console.error('Error sending message to Kafka:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
}