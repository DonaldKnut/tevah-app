"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)(); // In-memory file storage
// Public Auth Routes
router.post("/clerk-login", rateLimiter_1.authRateLimiter, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.clerkLogin));
router.post("/oauth-login", rateLimiter_1.authRateLimiter, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.oauthLogin));
router.post("/register", rateLimiter_1.authRateLimiter, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.registerUser));
router.post("/login", rateLimiter_1.authRateLimiter, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.loginUser));
// Sensitive Public Routes
router.post("/verify-email", rateLimiter_1.sensitiveEndpointRateLimiter, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.verifyEmail));
router.post("/reset-password", rateLimiter_1.sensitiveEndpointRateLimiter, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.resetPassword));
router.post("/resend-verification-email", rateLimiter_1.sensitiveEndpointRateLimiter, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.resendVerificationEmail));
// Protected Routes
router.post("/complete-profile", auth_middleware_1.verifyToken, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.completeUserProfile));
router.get("/me", auth_middleware_1.verifyToken, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.getCurrentUser));
router.get("/session", auth_middleware_1.verifyToken, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.getUserSession));
// Avatar Upload Endpoint
router.post("/update-avatar", auth_middleware_1.verifyToken, upload.single("avatar"), (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.updateUserAvatar));
exports.default = router;
