import { Router } from "express";
import multer from "multer";
import authController from "../controllers/auth.controller";
import { verifyToken } from "../middleware/auth.middleware";
import {
  authRateLimiter,
  sensitiveEndpointRateLimiter,
} from "../middleware/rateLimiter";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const upload = multer(); // In-memory file storage

// Public Auth Routes
router.post(
  "/clerk-login",
  authRateLimiter,
  asyncHandler(authController.clerkLogin)
);

router.post(
  "/oauth-login",
  authRateLimiter,
  asyncHandler(authController.oauthLogin)
);

router.post(
  "/register",
  authRateLimiter,
  asyncHandler(authController.registerUser)
);

router.post("/login", authRateLimiter, asyncHandler(authController.loginUser));

// Sensitive Public Routes
router.post(
  "/verify-email",
  sensitiveEndpointRateLimiter,
  asyncHandler(authController.verifyEmail)
);

router.post(
  "/reset-password",
  sensitiveEndpointRateLimiter,
  asyncHandler(authController.resetPassword)
);

router.post(
  "/resend-verification-email",
  sensitiveEndpointRateLimiter,
  asyncHandler(authController.resendVerificationEmail)
);

// Protected Routes
router.post(
  "/complete-profile",
  verifyToken,
  asyncHandler(authController.completeUserProfile)
);

router.get("/me", verifyToken, asyncHandler(authController.getCurrentUser));

router.get(
  "/session",
  verifyToken,
  asyncHandler(authController.getUserSession)
);

// Avatar Upload Endpoint
router.post(
  "/update-avatar",
  verifyToken,
  upload.single("avatar"),
  asyncHandler(authController.updateUserAvatar)
);

export default router;
