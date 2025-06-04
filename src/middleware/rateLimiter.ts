import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

export const authRateLimiter =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
    ? (_req: Request, _res: Response, next: NextFunction) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 20,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req: Request, res: Response) =>
          res.status(429).json({
            success: false,
            message: "Too many requests, please try again later",
          }),
      });

export const sensitiveEndpointRateLimiter =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
    ? (_req: Request, _res: Response, next: NextFunction) => next()
    : rateLimit({
        windowMs: 60 * 60 * 1000,
        max: 5,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req: Request, res: Response) =>
          res.status(429).json({
            success: false,
            message: "Too many attempts, please try again in an hour",
          }),
      });
