import { Request, Response, NextFunction } from "express";
import { verifyClerkToken } from "../utils/clerk";

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await verifyClerkToken(token);

    // Set userId on request object (from Clerk JWT 'sub')
    req.userId = decoded.sub;

    next(); // ✅ continue to route
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
      detail: error.message,
    });
  }
};
