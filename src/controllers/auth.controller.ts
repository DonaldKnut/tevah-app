import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendVerificationEmail, sendWelcomeEmail } from "../utils/mailer";
import { User } from "../models/user.model";
import { verifyClerkToken } from "../utils/clerk";

export const clerkLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, userInfo } = req.body;

    if (!token || !userInfo) {
      res
        .status(400)
        .json({ success: false, message: "Missing token or user info" });
      return;
    }

    const decoded = await verifyClerkToken(token);
    const email = decoded.email;

    let user = await User.findOne({ email });
    const isNewUser = !user;

    if (!user) {
      user = await User.create({
        email,
        firstName: userInfo.firstName || "User", // Updated
        lastName: userInfo.lastName || "", // Updated
        avatar: userInfo.avatar || "",
        provider: "clerk",
        clerkId: decoded.sub,
        isEmailVerified: true,
        isProfileComplete: false,
        age: 0,
        isKid: false,
        section: "adults",
        role: "learner",
        hasConsentedToPrivacyPolicy: false,
      });

      await sendWelcomeEmail(user.email, user.firstName || "User"); // Updated
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName, // Updated
        lastName: user.lastName, // Updated
        avatar: user.avatar,
        isNewUser,
      },
      needsAgeSelection: !user.age,
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, firstName, lastName } = req.body; // Updated

    if (!email || !password || !firstName) {
      res.status(400).json({
        success: false,
        message: "Missing email, password, or firstName",
      });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res
        .status(400)
        .json({ success: false, message: "Email already registered" });
      return;
    }

    const verificationCode = crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      firstName, // Updated
      lastName, // Updated
      provider: "email",
      password: hashedPassword,
      verificationCode,
      verificationCodeExpires,
      isEmailVerified: false,
      isProfileComplete: false,
      age: 0,
      isKid: false,
      section: "adults",
      role: "learner",
      hasConsentedToPrivacyPolicy: false,
    });

    await sendVerificationEmail(user.email, user.firstName, verificationCode); // Updated

    res.status(201).json({
      success: true,
      message: "User registered. Please verify your email.",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName, // Updated
        lastName: user.lastName, // Updated
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({
        success: false,
        message: "Missing email or verification code",
      });
      return;
    }

    const user = await User.findOne({ email, verificationCode: code });

    if (!user) {
      res
        .status(400)
        .json({ success: false, message: "Invalid email or code" });
      return;
    }

    if (user.verificationCodeExpires < new Date()) {
      res
        .status(400)
        .json({ success: false, message: "Verification code expired" });
      return;
    }

    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, user.firstName || "User"); // Updated

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName, // Updated
        lastName: user.lastName, // Updated
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      res.status(400).json({
        success: false,
        message: "Missing email, token, or new password",
      });
      return;
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerificationEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: "Missing email" });
      return;
    }

    const user = await User.findOne({ email, provider: "email" });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    if (user.isEmailVerified) {
      res
        .status(400)
        .json({ success: false, message: "Email already verified" });
      return;
    }

    const verificationCode = crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    await sendVerificationEmail(
      user.email,
      user.firstName || "User",
      verificationCode
    ); // Updated

    res.status(200).json({
      success: true,
      message: "Verification email resent",
    });
  } catch (error) {
    next(error);
  }
};

export const completeUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { age, location, hasConsentedToPrivacyPolicy } = req.body;

    if (!age || !hasConsentedToPrivacyPolicy) {
      res
        .status(400)
        .json({ success: false, message: "Missing age or privacy consent" });
      return;
    }

    const section = age < 13 ? "kids" : "adults";

    const user = await User.findByIdAndUpdate(
      userId,
      {
        age,
        location,
        section,
        isKid: section === "kids",
        hasConsentedToPrivacyPolicy,
        isProfileComplete: true,
      },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select(
      "email firstName lastName avatar isProfileComplete role section" // Updated
    );

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const getSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select(
      "_id email firstName lastName isProfileComplete role" // Updated
    );

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      session: {
        userId: user._id,
        email: user.email,
        firstName: user.firstName, // Updated
        lastName: user.lastName, // Updated
        isProfileComplete: user.isProfileComplete,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
