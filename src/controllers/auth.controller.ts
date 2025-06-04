import { Request, Response, NextFunction } from "express";
import authService from "../service/auth.service";
import { VALID_INTERESTS } from "../constants/interests";

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

      const user = await authService.registerUser(
        email,
        password,
        firstName,
        lastName,
        desiredRole,
        avatarFile.buffer
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
          message: "Unauthorized: User ID missing",
        });
      }

      const {
        age,
        location,
        hasConsentedToPrivacyPolicy,
        desiredRole,
        interests,
        section,
      } = request.body;

      if (!age || !hasConsentedToPrivacyPolicy || !section) {
        return response.status(400).json({
          success: false,
          message: "Age, privacy policy consent, and section are required",
        });
      }

      // Validate section
      if (!["kids", "adults"].includes(section)) {
        return response.status(400).json({
          success: false,
          message: "Invalid section. Must be 'kids' or 'adults'",
        });
      }

      // Validate interests
      if (interests && !Array.isArray(interests)) {
        return response.status(400).json({
          success: false,
          message: "Interests must be an array",
        });
      }

      if (
        interests &&
        interests.some(
          (interest: string) => !VALID_INTERESTS.includes(interest)
        )
      ) {
        return response.status(400).json({
          success: false,
          message: `Invalid interests. Must be one of: ${VALID_INTERESTS.join(", ")}`,
        });
      }

      const user = await authService.completeUserProfile(
        userId,
        age,
        location,
        hasConsentedToPrivacyPolicy,
        desiredRole,
        interests,
        section
      );

      return response.status(200).json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          interests: user.interests,
          section: user.section,
          isProfileComplete: user.isProfileComplete,
        },
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

      const updateResult = await authService.updateUserAvatar(
        userId,
        avatarFile.buffer
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
