// src/middlewares/clerkAuth.ts
import { createClerkClient } from "@clerk/clerk-sdk-node";
import type { Request, Response, NextFunction } from "express";

// Initialize Clerk client with proper typing
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY || "",
});

// Type definitions for Clerk user data
declare global {
  namespace Express {
    interface Request {
      clerkUser?: {
        id: string;
        email: string;
        fullName: string;
        avatar?: string;
      };
    }
  }
}

export const extractUserFromToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionToken } = req.body;

  // Validate session token exists
  if (!sessionToken || typeof sessionToken !== "string") {
    return res.status(400).json({ error: "Valid session token required" });
  }

  try {
    // Verify session and get user
    const session = await clerk.sessions.verifySession(sessionToken);
    const user = await clerk.users.getUser(session.userId);

    // Validate essential user data exists
    if (!user.emailAddresses[0]?.emailAddress) {
      return res.status(400).json({ error: "User email not found" });
    }

    // Attach sanitized user data to request
    req.clerkUser = {
      id: user.id,
      email: user.emailAddresses[0].emailAddress,
      fullName:
        [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
        "Unknown",
      avatar: user.imageUrl,
    };

    next();
  } catch (error) {
    console.error("Clerk authentication error:", error);

    // Handle specific Clerk errors
    const errorMessage =
      error instanceof Error ? error.message : "Authentication failed";

    res.status(401).json({
      error: "Invalid session token",
      details: errorMessage,
    });
  }
};
