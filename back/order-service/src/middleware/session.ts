import { randomUUID } from "crypto";
import { Request, Response, NextFunction, RequestHandler } from "express";

export const ensureSession: RequestHandler = (req, res, next) => {
  let sessionId = (req as any).cookies?.sessionId;

  if (!sessionId) {
    sessionId = randomUUID();
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 2, // 2h
    });
  }

  (req as any).sessionId = sessionId;
  next();
};
