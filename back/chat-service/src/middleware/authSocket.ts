import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authSocket = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { user_id: string };
    socket.data.user_id = decoded.user_id; // Lưu user_id vào socket
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};