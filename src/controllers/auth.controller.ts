import { Request, Response, NextFunction } from "express";
import authService from "../service/auth.service";
import { VALID_INTERESTS } from "../constants/interests";
import { User } from "../models/user.model";
import multer from "multer";

class AuthController {
  async clerkLogin(request: Request, response: Response, next: NextFunction) {
    try {
      const { token, userInfo } = request.body;

      if (!token || !userInfo) {
        return response.status(400).json({
          success: false,
          message: "Authentication token and user information are required",
        });
      }

      const result = await authService.clerkLogin(token, userInfo);

      return response.status(200).json({
        success: true,
        user: result.user,
        needsAgeSelection: result.needsAgeSelection,
      });
    } catch (error) {
      return next(error);
    }
  }

  async oauthLogin(request: Request, response: Response, next: NextFunction) {
    try {
      const { provider, token, userInfo } = request.body;

      if (!provider || !token || !userInfo) {
        return response.status(400).json({
          success: false,
          message: "Provider, token, and user information are required",
        });
      }

      const result = await authService.oauthLogin(provider, token, userInfo);

      return response.status(200).json({
        success: true,
        message: "Login successful",
        token: result.token,
        user: result.user,
        isNewUser: result.isNewUser,
      });
    } catch (error) {
      return next(error);
    }
  }

  async registerUser(request: Request, response: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, desiredRole } =
        request.body;

      if (!email || !password || !firstName) {
        return response.status(400).json({
          success: false,
          message: "Email, password, and first name are required fields",
        });
      }

      const user = await authService.registerUser(
        email,
        password,
        firstName,
        lastName,
        desiredRole
      );

      return response.status(201).json({
        success: true,
        message: "User registered successfully. Please verify your email.",
        user,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Email address is already registered"
      ) {
        return response.status(400).json({
          success: false,
          message: error.message,
        });
      }
      return next(error);
    }
  }

  async registerUserWithAvatar(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const { email, password, firstName, lastName, desiredRole } =
        request.body;
      const avatarFile = request.file;

      if (!email || !password || !firstName) {
        return response.status(400).json({
          success: false,
          message: "Email, password, and first name are required fields",
        });
      }

      if (!avatarFile) {
        return response.status(400).json({
          success: false,
          message: "Avatar image is required",
        });
      }

      const validImageMimeTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!validImageMimeTypes.includes(avatarFile.mimetype)) {
        return response.status(400).json({
          success: false,
          message: `Invalid image type: ${avatarFile.mimetype}`,
        });
      }

      const user = await authService.registerUser(
        email,
        password,
        firstName,
        lastName,
        desiredRole,
        avatarFile.buffer,
        avatarFile.mimetype
      );

      return response.status(201).json({
        success: true,
        message: "User registered successfully. Please verify your email.",
        user,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Email address is already registered"
      ) {
        return response.status(400).json({
          success: false,
          message: error.message,
        });
      }
      return next(error);
    }
  }

  async loginUser(request: Request, response: Response, next: NextFunction) {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        return response.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const result = await authService.loginUser(email, password);

      return response.status(200).json({
        success: true,
        message: "Login successful",
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Invalid email or password") {
          return response.status(400).json({
            success: false,
            message: error.message,
          });
        }
        if (error.message === "Please verify your email before logging in") {
          return response.status(403).json({
            success: false,
            message: error.message,
          });
        }
      }
      return next(error);
    }
  }

  async verifyEmail(request: Request, response: Response, next: NextFunction) {
    try {
      const { email, code } = request.body;

      if (!email || !code) {
        return response.status(400).json({
          success: false,
          message: "Email and verification code are required",
        });
      }

      const user = await authService.verifyEmail(email, code);

      return response.status(200).json({
        success: true,
        message: "Email verified successfully",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Invalid email or code") {
          return response.status(400).json({
            success: false,
            message: error.message,
          });
        }
        if (error.message === "Verification code expired") {
          return response.status(400).json({
            success: false,
            message: error.message,
          });
        }
      }
      return next(error);
    }
  }

  async resetPassword(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const { email, token, newPassword } = request.body;

      if (!email || !token || !newPassword) {
        return response.status(400).json({
          success: false,
          message: "Email, token, and new password are required",
        });
      }

      await authService.resetPassword(email, token, newPassword);

      return response.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Invalid or expired reset token"
      ) {
        return response.status(400).json({
          success: false,
          message: error.message,
        });
      }
      return next(error);
    }
  }

  async resendVerificationEmail(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const { email } = request.body;

      if (!email) {
        return response.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      await authService.resendVerificationEmail(email);

      return response.status(200).json({
        success: true,
        message: "Verification email resent successfully",
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "User not found") {
          return response.status(404).json({
            success: false,
            message: error.message,
          });
        }
        if (error.message === "Email already verified") {
          return response.status(400).json({
            success: false,
            message: error.message,
          });
        }
      }
      return next(error);
    }
  }

  async completeUserProfile(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const userId = request.userId;

      if (!userId) {
        return response.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Destructure all possible profile fields
      const {
        age,
        isKid,
        section,
        role,
        location,
        avatarUpload,
        interests,
        hasConsentedToPrivacyPolicy,
        parentalControlEnabled,
        parentEmail,
      } = request.body;

      // Build update object based on what's provided
      const updateFields: any = {};
      if (age !== undefined) updateFields.age = age;
      if (isKid !== undefined) updateFields.isKid = isKid;
      if (section !== undefined) updateFields.section = section;
      if (role !== undefined) updateFields.role = role;
      if (location !== undefined) updateFields.location = location;
      if (avatarUpload !== undefined) updateFields.avatarUpload = avatarUpload;
      if (interests !== undefined) updateFields.interests = interests;
      if (hasConsentedToPrivacyPolicy !== undefined) {
        updateFields.hasConsentedToPrivacyPolicy = hasConsentedToPrivacyPolicy;
      }
      if (parentalControlEnabled !== undefined) {
        updateFields.parentalControlEnabled = parentalControlEnabled;
      }
      if (parentEmail !== undefined) updateFields.parentEmail = parentEmail;

      // Fetch current user
      const userBeforeUpdate = await User.findById(userId);

      if (!userBeforeUpdate) {
        return response.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Helper function to check field existence
      const isSet = (field: string) =>
        userBeforeUpdate[field] !== undefined ||
        updateFields[field] !== undefined;

      const isProfileComplete =
        isSet("age") &&
        isSet("isKid") &&
        (userBeforeUpdate.section || updateFields.section) &&
        (userBeforeUpdate.role || updateFields.role) &&
        isSet("hasConsentedToPrivacyPolicy");

      if (isProfileComplete) {
        updateFields.isProfileComplete = true;
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
        new: true,
      });

      return response.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getCurrentUser(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const userId = request.userId;
      if (!userId) {
        return response.status(401).json({
          success: false,
          message: "Unauthorized: User ID missing",
        });
      }

      const user = await authService.getCurrentUser(userId);

      return response.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        return response.status(404).json({
          success: false,
          message: error.message,
        });
      }
      return next(error);
    }
  }

  async getUserSession(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const userId = request.userId;
      if (!userId) {
        return response.status(401).json({
          success: false,
          message: "Unauthorized: User ID missing",
        });
      }

      const session = await authService.getUserSession(userId);

      return response.status(200).json({
        success: true,
        session,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        return response.status(404).json({
          success: false,
          message: error.message,
        });
      }
      return next(error);
    }
  }

  async updateUserAvatar(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const userId = request.userId;
      const avatarFile = request.file;

      if (!userId) {
        return response.status(401).json({
          success: false,
          message: "Unauthorized: User ID missing",
        });
      }

      if (!avatarFile) {
        return response.status(400).json({
          success: false,
          message: "Avatar image is required",
        });
      }

      const validImageMimeTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!validImageMimeTypes.includes(avatarFile.mimetype)) {
        return response.status(400).json({
          success: false,
          message: `Invalid image type: ${avatarFile.mimetype}`,
        });
      }

      const updateResult = await authService.updateUserAvatar(
        userId,
        avatarFile.buffer,
        avatarFile.mimetype
      );

      return response.status(200).json({
        success: true,
        message: "Avatar updated successfully",
        data: updateResult,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        return response.status(404).json({
          success: false,
          message: error.message,
        });
      }
      if (
        error instanceof Error &&
        error.message.startsWith("Invalid image type")
      ) {
        return response.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (
        error instanceof multer.MulterError &&
        error.code === "LIMIT_UNEXPECTED_FILE"
      ) {
        return response.status(400).json({
          success: false,
          message: `Unexpected field in file upload. Expected field name: 'avatar'`,
        });
      }
      if (
        error instanceof multer.MulterError &&
        error.code === "LIMIT_FILE_SIZE"
      ) {
        return response.status(400).json({
          success: false,
          message: "File size exceeds the 5MB limit",
        });
      }
      return next(error);
    }
  }

  async initiatePasswordReset(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const { email } = request.body;

      if (!email) {
        return response.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const resetToken = await authService.initiatePasswordReset(email);

      return response.status(200).json({
        success: true,
        message: "Password reset initiated",
        resetToken,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        return response.status(404).json({
          success: false,
          message: error.message,
        });
      }
      return next(error);
    }
  }
}

export default new AuthController();
