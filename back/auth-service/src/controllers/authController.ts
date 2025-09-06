import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: {
        username,
        email,
        password_hash,
      },
    });
    res.status(201).json({ user_id: user.user_id, username, email });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: `Failed to register ${error}` });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign({ user_id: user.user_id }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(
      { user_id: user.user_id },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );
    res.cookie('rt', refreshToken, {
      httpOnly: true, secure: true, sameSite: 'lax',
      path: '/refresh', maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ accessToken, user_id: user.user_id, username: user.username });

  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

export const refreshToken = (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.rt;
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid refresh token' });
      }

      const newAccessToken = jwt.sign(
        { user_id: decoded.user_id },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      return res.status(200).json({ token: newAccessToken });
    });

  } catch (error) {
    console.error('Error refreshing token:', error);
    return res.status(500).json({ error: 'Failed to refresh token' });
  }
};