// This extends the Express.Request interface globally
import "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
