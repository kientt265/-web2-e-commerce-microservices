import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  user_id: string;
  // Thêm các trường khác nếu cần
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, 'your-secret-key') as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};