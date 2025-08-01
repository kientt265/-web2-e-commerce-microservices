import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


export const getMessages = async (req: Request, res: Response) => {
  const { conversation_id } = req.params;

  try {
    const messages = await prisma.messages.findMany({
      where: { conversation_id },
      orderBy: { sent_at: 'asc' },
      include: {
        sender: { select: { user_id: true, username: true } },
      },
    });
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Tạo cuộc trò chuyện mới
export const createConversation = async (req: Request, res: Response) => {
  const { type, name, user_ids } = req.body; // user_ids: danh sách user_id tham gia

  try {
    const conversation = await prisma.conversations.create({
      data: {
        type,
        name,
        members: {
          create: user_ids.map((user_id: string) => ({
            user_id,
            joined_at: new Date(),
          })),
        },
      },
      include: { members: true },
    });
    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  const { conversation_id, sender_id, content } = req.body;

  try {
    // Kiểm tra xem người dùng có trong cuộc trò chuyện không
    const member = await prisma.conversation_members.findFirst({
      where: {
        conversation_id,
        user_id: sender_id
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'User is not a member of this conversation' });
    }

    const message = await prisma.messages.create({
      data: {
        conversation_id,
        sender_id,
        content,
        sent_at: new Date(),
      },
      include: {
        sender: {
          select: {
            user_id: true,
            username: true
          }
        }
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};