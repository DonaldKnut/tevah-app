import { Router } from "express";
// import {
//   clerkLogin,
//   completeUserProfile,
//   getCurrentUser,
//   getSession,
//   register,
//   verifyEmail,
//   resetPassword,
//   resendVerificationEmail,
// } from "../controllers/auth.controller";
import { verifyToken } from "../middleware/auth.middleware";
import {
  clerkLogin,
  completeUserProfile,
  getCurrentUser,
  getSession,
  register,
  resendVerificationEmail,
  resetPassword,
  verifyEmail,
  login,
} from "../controllers/auth.controller";
const router = Router();

router.post("/clerk-login", clerkLogin);
router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/reset-password", resetPassword);
router.post("/resend-verification-email", resendVerificationEmail);
router.post("/complete-profile", verifyToken, completeUserProfile);
router.get("/me", verifyToken, getCurrentUser);
router.get("/session", verifyToken, getSession);
router.post("/login", login);

export default router;
