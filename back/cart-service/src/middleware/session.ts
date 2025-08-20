import { randomUUID } from "crypto";
import { Request, Response, NextFunction } from "express";

export function ensureSession(req: Request, res: Response, next: NextFunction) {
  let sessionId = req.cookies.sessionId;

  if (!sessionId) {
    sessionId = randomUUID();

    // Gửi cookie về cho client
    res.cookie("sessionId", sessionId, {
      httpOnly: true, // bảo mật, FE JS không đọc được
      maxAge: 1000 * 60 * 60 * 2, // 2h
    });
  }

  // gắn sessionId vào request để các API khác dùng
  (req as any).sessionId = sessionId;
  next();
}
