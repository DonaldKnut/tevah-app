import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { sendVerificationEmail, sendWelcomeEmail } from "../utils/mailer";
import { verifyClerkToken } from "../utils/clerk";
import fileUploadService from "../utils/fileUpload.service";

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

class AuthService {
  private setVerificationFlags(role: string) {
    const verificationFlags = {
      isVerifiedCreator: false,
      isVerifiedVendor: false,
      isVerifiedChurch: false,
    };

    switch (role) {
      case "content_creator":
        verificationFlags.isVerifiedCreator = false;
        break;
      case "vendor":
        verificationFlags.isVerifiedVendor = false;
        break;
      case "church_admin":
        verificationFlags.isVerifiedChurch = false;
        break;
    }

    return verificationFlags;
  }

  async oauthLogin(provider: string, token: string, userInfo: any) {
    const decoded = await verifyClerkToken(token);
    const email = decoded.email;

    if (!email) {
      throw new Error(
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} email not found in Clerk token`
      );
    }

    let user = await User.findOne({ email });
    const isNewUser = !user;

    if (!user) {
      user = await User.create({
        email,
        firstName: userInfo.firstName || "User",
        lastName: userInfo.lastName || "",
        avatar: userInfo.avatar || "",
        provider: provider.toLowerCase(),
        clerkId: decoded.sub,
        isEmailVerified: true,
        isProfileComplete: false,
        age: 0,
        isKid: false,
        section: "adults",
        role: "learner",
        hasConsentedToPrivacyPolicy: false,
      });

      await sendWelcomeEmail(user.email, user.firstName || "User");
    }

    const jwtToken = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return {
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        isProfileComplete: user.isProfileComplete,
      },
      isNewUser,
    };
  }

  async clerkLogin(token: string, userInfo: any) {
    const decoded = await verifyClerkToken(token);
    const email = decoded.email;

    let user = await User.findOne({ email });
    const isNewUser = !user;

    if (!user) {
      user = await User.create({
        email,
        firstName: userInfo.firstName || "User",
        lastName: userInfo.lastName || "",
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

      await sendWelcomeEmail(user.email, user.firstName || "User");
    }

    return {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        isNewUser,
      },
      needsAgeSelection: !user.age,
    };
  }

  async registerUser(
    email: string,
    password: string,
    firstName: string,
    lastName?: string,
    desiredRole?: string,
    avatarBuffer?: Buffer
  ) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Email address is already registered");
    }

    const allowedRoles = [
      "learner",
      "parent",
      "educator",
      "content_creator",
      "vendor",
      "church_admin",
    ];

    const role =
      desiredRole && allowedRoles.includes(desiredRole)
        ? desiredRole
        : "learner";

    const verificationCode = crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationFlags = this.setVerificationFlags(role);

    let avatarUrl: string | undefined;
    if (avatarBuffer) {
      avatarUrl = await fileUploadService.uploadImage(
        avatarBuffer,
        "user-avatars"
      );
    }

    const newUser = await User.create({
      email,
      firstName,
      lastName,
      avatar: avatarUrl,
      provider: "email",
      password: hashedPassword,
      verificationCode,
      verificationCodeExpires,
      isEmailVerified: false,
      isProfileComplete: false,
      age: 0,
      isKid: false,
      section: "adults",
      role,
      hasConsentedToPrivacyPolicy: false,
      ...verificationFlags,
    });

    await sendVerificationEmail(
      newUser.email,
      newUser.firstName,
      verificationCode
    );

    return {
      id: newUser._id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      avatar: newUser.avatar,
      role: newUser.role,
    };
  }

  async loginUser(email: string, password: string) {
    const user = await User.findOne({ email, provider: "email" });
    if (!user || !(await bcrypt.compare(password, user.password || ""))) {
      throw new Error("Invalid email or password");
    }

    if (!user.isEmailVerified) {
      throw new Error("Please verify your email before logging in");
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
        isProfileComplete: user.isProfileComplete,
      },
    };
  }

  async verifyEmail(email: string, code: string) {
    const user = await User.findOne({ email, verificationCode: code });
    if (!user) {
      throw new Error("Invalid email or code");
    }

    if (
      user.verificationCodeExpires &&
      user.verificationCodeExpires < new Date()
    ) {
      throw new Error("Verification code expired");
    }

    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, user.firstName || "User");

    return user;
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return user;
  }

  async resendVerificationEmail(email: string) {
    const user = await User.findOne({ email, provider: "email" });
    if (!user) {
      throw new Error("User not found");
    }

    if (user.isEmailVerified) {
      throw new Error("Email already verified");
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
    );

    return user;
  }

  async completeUserProfile(
    userId: string,
    age: number,
    location: string | undefined,
    hasConsentedToPrivacyPolicy: boolean,
    desiredRole?: string,
    interests?: string[],
    section?: string
  ) {
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    let userSection = section;
    if (!userSection) {
      userSection = age < 13 ? "kids" : "adults";
    }

    let role = currentUser.role;
    if (currentUser.role === "learner" && desiredRole) {
      const allowedRoles = [
        "learner",
        "parent",
        "educator",
        "content_creator",
        "vendor",
        "church_admin",
      ];
      if (allowedRoles.includes(desiredRole)) {
        role = desiredRole;
      }
    }

    const verificationFlags =
      role !== currentUser.role ? this.setVerificationFlags(role) : {};

    const updateData: any = {
      age,
      location,
      section: userSection,
      isKid: userSection === "kids",
      role,
      hasConsentedToPrivacyPolicy,
      isProfileComplete: true,
      ...verificationFlags,
    };

    if (interests && Array.isArray(interests)) {
      updateData.interests = interests;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async getCurrentUser(userId: string) {
    const user = await User.findById(userId).select(
      "email firstName lastName avatar isProfileComplete role section interests"
    );

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async getUserSession(userId: string) {
    const user = await User.findById(userId).select(
      "_id email firstName lastName isProfileComplete role"
    );

    if (!user) {
      throw new Error("User not found");
    }

    return {
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isProfileComplete: user.isProfileComplete,
      role: user.role,
    };
  }

  async updateUserAvatar(userId: string, avatarBuffer: Buffer) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.avatar) {
      try {
        const publicId = user.avatar.split("/").pop()?.split(".")[0];
        if (publicId) {
          await fileUploadService.deleteImage(`user-avatars/${publicId}`);
        }
      } catch (error) {
        console.error("Error deleting old avatar:", error);
      }
    }

    const avatarUrl = await fileUploadService.uploadImage(
      avatarBuffer,
      "user-avatars"
    );

    user.avatar = avatarUrl;
    await user.save();

    return {
      avatarUrl: user.avatar,
      userId: user._id,
    };
  }

  async initiatePasswordReset(email: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 3600000);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    return resetToken;
  }
}

export default new AuthService();
