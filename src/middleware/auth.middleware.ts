import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Middleware to verify JWT token and attach userId to request
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  // Check for Bearer token format
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ success: false, message: "Unauthorized: No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    // Decode and verify token using your secret key
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    // Attach userId to request object
    req.userId = decodedToken.userId;

    // Proceed to the next middleware or controller
    next();
  } catch (error: any) {
    // Token is invalid or expired
    res.status(401).json({
      success: false,
      message: "Invalid token",
      detail: error.message,
    });
  }
};
