import { PrismaClient } from "@prisma/client";
import { producer } from '../config/kafka';
import { Server, Socket } from "socket.io";
import { randomUUID } from "crypto";
import { authSocket } from "../middleware/authSocket";
const prisma = new PrismaClient();

export const handleSocketConnection = (io: Server) => {
    io.use(authSocket).on('connection', (socket: Socket) => {
        console.log(`[Socket] ✨ New client connected | ID: ${socket.id}`);
        console.log(`[Socket] 🔑 Auth token:`, socket.handshake.auth);

        socket.on('join_conversation', async (conversationId: string) => {
            try {
                const userId = socket.handshake.auth.token; // Assuming token is user ID
                console.log(`[Socket] 🚪 User ${socket.id} attempting to join conversation ${conversationId}`);
                
                // const isMember = await prisma.conversation_members.findFirst({
                //     where: { conversation_id: conversationId, user_id: userId },
                // });

                // if (!isMember) {
                //     console.warn(`[Socket] ⚠️ User ${socket.id} not authorized for conversation ${conversationId}`);
                //     socket.emit('error', { message: 'Not authorized to join this conversation' });
                //     return;
                // }

                socket.join(conversationId);
                console.log(`[Socket] ✅ User ${socket.id} joined conversation ${conversationId}`);
                socket.emit('join_success', { conversationId });
            } catch (error) {
                console.error(`[Socket] ❌ Error joining conversation:`, error);
                socket.emit('error', { message: 'Failed to join conversation' });
            }
        });

        socket.on('send_message', async (data: { 
            conversation_id: string; 
            sender_id: string; 
            content: string 
        }) => {
            console.log(`[Socket] 📩 Message received from client:`, data);
            try {
                // Validate input data
                if (!data.conversation_id || !data.sender_id || !data.content) {
                    console.error('[Socket] ❌ Missing required fields:', data);
                    throw new Error('Missing required fields');
                }

                // Validate UUID format
                if (!isValidUUID(data.conversation_id) || !isValidUUID(data.sender_id)) {
                    console.error('[Socket] ❌ Invalid UUID format:', {
                        conversation_id: data.conversation_id,
                        sender_id: data.sender_id
                    });
                    throw new Error('Invalid UUID format');
                }

                const isMember = await prisma.conversation_members.findFirst({
                    where: {
                        conversation_id: data.conversation_id,
                        user_id: data.sender_id
                    }
                });

                if (!isMember) {
                    console.warn(`[Socket] ⚠️ User ${data.sender_id} not authorized for conversation ${data.conversation_id}`);
                    throw new Error('Sender is not a member of this conversation');
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
                    is_read: false
                };

                const topic = conversation?.type === 'group' ? 'group-chat-messages' : 'private-chat-messages';
                console.log(`[Socket] 📤 Sending message to Kafka topic: ${topic}`);
                
                await producer.send({
                    topic,
                    messages: [{ value: JSON.stringify(message) }],
                });

                console.log(`[Socket] ✅ Message successfully sent to Kafka`);
                socket.emit('message_sent', { success: true, message });
                io.to(data.conversation_id).emit('new_message', message);

            } catch (error) {
                console.error('[Socket] ❌ Error processing message:', error);
                socket.emit('error', { 
                    message: (error instanceof Error ? error.message : 'Failed to send message')
                });
            }
        });

        socket.on('disconnect', (reason) => {
            console.log(`[Socket] ❌ Client disconnected | ID: ${socket.id} | Reason: ${reason}`);
        });
    });
}

// Helper function to validate UUID format
function isValidUUID(uuid: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}